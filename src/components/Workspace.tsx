import { useRef, useCallback, useState, useImperativeHandle, forwardRef } from 'react'
import { useWorkspaceStore } from '../store/workspaceStore'
import { useElementStore } from '../store/elementStore'
import { useCanvas } from '../hooks/useCanvas'
import { useCraft } from '../hooks/useCraft'
import { screenToCanvas, generateId, checkOverlap } from '../utils/helpers'
import ElementCard from './ElementCard'
import ContextMenu, { type ContextMenuItem } from './ContextMenu'

interface DragState {
  instanceId: string
  offsetX: number
  offsetY: number
}

export interface WorkspaceHandle {
  handleDropFromSidebar: (elementId: string, screenX: number, screenY: number) => void
}

const Workspace = forwardRef<WorkspaceHandle>(function Workspace(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasLayerRef = useRef<HTMLDivElement>(null)
  const { scale, panX, panY } = useCanvas(containerRef)
  const { items, moveItem, removeItem, clearAll, addItem } = useWorkspaceStore()
  const getElement = useElementStore(s => s.getElement)
  const { craft, crafting, craftingIds } = useCraft()

  const [dragging, setDragging] = useState<DragState | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [overlapTargetId, setOverlapTargetId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; instanceId: string
  } | null>(null)

  const findOverlapTarget = useCallback(
    (draggedId: string) => {
      const canvasLayer = canvasLayerRef.current
      if (!canvasLayer) return null

      const draggedEl = canvasLayer.querySelector(`[data-instance-id="${draggedId}"]`)
      if (!draggedEl) return null
      const draggedRect = draggedEl.getBoundingClientRect()

      for (const item of items) {
        if (item.instanceId === draggedId) continue
        if (craftingIds?.includes(item.instanceId)) continue

        const el = canvasLayer.querySelector(`[data-instance-id="${item.instanceId}"]`)
        if (!el) continue

        if (checkOverlap(draggedRect, el.getBoundingClientRect())) {
          return item.instanceId
        }
      }
      return null
    },
    [items, craftingIds],
  )

  const handleElementPointerDown = useCallback(
    (e: React.PointerEvent, instanceId: string) => {
      if (e.button !== 0 || crafting) return
      e.stopPropagation()
      e.preventDefault()

      const item = items.find(i => i.instanceId === instanceId)
      if (!item) return
      if (craftingIds?.includes(instanceId)) return

      setSelectedId(instanceId)
      setContextMenu(null)

      const canvasX = item.x * scale + panX
      const canvasY = item.y * scale + panY
      const offsetX = e.clientX - canvasX
      const offsetY = e.clientY - canvasY

      setDragging({ instanceId, offsetX, offsetY })

      const onMove = (me: PointerEvent) => {
        const cx = (me.clientX - offsetX - panX) / scale
        const cy = (me.clientY - offsetY - panY) / scale
        moveItem(instanceId, cx, cy)

        requestAnimationFrame(() => {
          const target = findOverlapTarget(instanceId)
          setOverlapTargetId(target)
        })
      }

      const onUp = () => {
        const target = findOverlapTarget(instanceId)
        setDragging(null)
        setOverlapTargetId(null)

        if (target) {
          const targetItem = useWorkspaceStore.getState().items.find(i => i.instanceId === target)
          const dragItem = useWorkspaceStore.getState().items.find(i => i.instanceId === instanceId)
          if (targetItem && dragItem) {
            craft(dragItem, targetItem)
          }
        }

        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [items, scale, panX, panY, moveItem, crafting, craftingIds, findOverlapTarget, craft],
  )

  useImperativeHandle(ref, () => ({
    handleDropFromSidebar(elementId: string, screenX: number, screenY: number) {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      if (
        screenX < rect.left || screenX > rect.right ||
        screenY < rect.top || screenY > rect.bottom
      ) return

      const pos = screenToCanvas(
        screenX - rect.left,
        screenY - rect.top,
        { x: panX, y: panY },
        scale,
      )

      addItem({
        instanceId: generateId(),
        elementId,
        x: pos.x - 40,
        y: pos.y - 16,
      })
    },
  }), [panX, panY, scale, addItem])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, instanceId: string) => {
      e.preventDefault()
      e.stopPropagation()
      setSelectedId(instanceId)
      setContextMenu({ x: e.clientX, y: e.clientY, instanceId })
    },
    [],
  )

  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== containerRef.current) return
      if (items.length === 0) return
      if (window.confirm('确定要清空工作台上的所有元素吗？')) {
        clearAll()
      }
    },
    [items.length, clearAll],
  )

  const handleCanvasClick = useCallback(() => {
    setSelectedId(null)
    setContextMenu(null)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        removeItem(selectedId)
        setSelectedId(null)
      }
    },
    [selectedId, removeItem],
  )

  const contextMenuItems: ContextMenuItem[] = contextMenu
    ? [
        {
          label: '删除',
          icon: '🗑️',
          danger: true,
          onClick: () => {
            removeItem(contextMenu.instanceId)
            if (selectedId === contextMenu.instanceId) setSelectedId(null)
          },
        },
      ]
    : []

  const gridSize = 20 * scale

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden outline-none"
      style={{
        backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${panX % gridSize}px ${panY % gridSize}px`,
      }}
      tabIndex={0}
      onClick={handleCanvasClick}
      onDoubleClick={handleCanvasDoubleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 px-2 py-1 bg-white/80 rounded text-xs text-gray-500 border border-gray-200 select-none pointer-events-none">
        {Math.round(scale * 100)}%
      </div>

      {/* Empty state hint */}
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-gray-400 text-sm">从左侧元素库拖入元素开始合成吧！</p>
        </div>
      )}

      {/* Crafting indicator */}
      {crafting && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium shadow-sm pointer-events-none animate-pulse">
          合成中...
        </div>
      )}

      {/* Canvas layer */}
      <div
        ref={canvasLayerRef}
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {items.map(item => {
          const element = getElement(item.elementId)
          if (!element) return null

          const isSelected = selectedId === item.instanceId
          const isDragging = dragging?.instanceId === item.instanceId
          const isOverlapTarget = overlapTargetId === item.instanceId
          const isCrafting = craftingIds?.includes(item.instanceId) ?? false

          return (
            <div
              key={item.instanceId}
              data-instance-id={item.instanceId}
              className="absolute"
              style={{
                transform: `translate(${item.x}px, ${item.y}px)`,
                zIndex: isDragging ? 999 : isSelected ? 100 : 1,
                transition: isDragging ? 'none' : 'transform 0.1s ease',
                opacity: isCrafting ? 0.5 : 1,
                pointerEvents: isCrafting ? 'none' : 'auto',
              }}
              onPointerDown={e => handleElementPointerDown(e, item.instanceId)}
              onContextMenu={e => handleContextMenu(e, item.instanceId)}
            >
              <ElementCard
                emoji={element.emoji}
                name={element.name}
                className={`${
                  isSelected ? 'ring-2 ring-blue-400 shadow-lg' : ''
                } ${isDragging ? 'opacity-80 shadow-xl' : ''} ${
                  isOverlapTarget ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-200' : ''
                }`}
              />
            </div>
          )
        })}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          visible={!!contextMenu}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
})

export default Workspace
