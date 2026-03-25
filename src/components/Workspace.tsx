import { useRef, useCallback, useState } from 'react'
import { useWorkspaceStore } from '../store/workspaceStore'
import { useElementStore } from '../store/elementStore'
import { useCanvas } from '../hooks/useCanvas'
import { screenToCanvas } from '../utils/helpers'
import ElementCard from './ElementCard'
import ContextMenu, { type ContextMenuItem } from './ContextMenu'

interface DragState {
  instanceId: string
  offsetX: number
  offsetY: number
}

export default function Workspace() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scale, panX, panY } = useCanvas(containerRef)
  const { items, moveItem, removeItem, clearAll } = useWorkspaceStore()
  const getElement = useElementStore(s => s.getElement)

  const [dragging, setDragging] = useState<DragState | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; instanceId: string
  } | null>(null)

  const handleElementPointerDown = useCallback(
    (e: React.PointerEvent, instanceId: string) => {
      if (e.button !== 0) return
      e.stopPropagation()
      e.preventDefault()

      const item = items.find(i => i.instanceId === instanceId)
      if (!item) return

      setSelectedId(instanceId)
      setContextMenu(null)

      const canvasX = item.x * scale + panX
      const canvasY = item.y * scale + panY

      setDragging({
        instanceId,
        offsetX: e.clientX - canvasX,
        offsetY: e.clientY - canvasY,
      })

      const container = containerRef.current
      if (container) {
        const onMove = (me: PointerEvent) => {
          const newCanvas = screenToCanvas(
            me.clientX - (e.clientX - canvasX - panX + panX),
            me.clientY - (e.clientY - canvasY - panY + panY),
            { x: 0, y: 0 },
            1,
          )
          void newCanvas

          const cx = (me.clientX - (e.clientX - canvasX) - panX) / scale
          const cy = (me.clientY - (e.clientY - canvasY) - panY) / scale
          moveItem(instanceId, cx, cy)
        }

        const onUp = () => {
          setDragging(null)
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
        }

        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
      }
    },
    [items, scale, panX, panY, moveItem],
  )

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

      {/* Canvas layer */}
      <div
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

          return (
            <div
              key={item.instanceId}
              className="absolute"
              style={{
                transform: `translate(${item.x}px, ${item.y}px)`,
                zIndex: isDragging ? 999 : isSelected ? 100 : 1,
                transition: isDragging ? 'none' : undefined,
              }}
              onPointerDown={e => handleElementPointerDown(e, item.instanceId)}
              onContextMenu={e => handleContextMenu(e, item.instanceId)}
            >
              <ElementCard
                emoji={element.emoji}
                name={element.name}
                className={`${
                  isSelected
                    ? 'ring-2 ring-blue-400 shadow-lg'
                    : ''
                } ${isDragging ? 'opacity-80 shadow-xl' : ''}`}
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
}
