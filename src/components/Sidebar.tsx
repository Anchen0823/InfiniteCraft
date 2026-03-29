import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useElementStore } from '../store/elementStore'
import ElementCard from './ElementCard'
import DragOverlay from './DragOverlay'

type SortMode = 'time' | 'name'

interface SidebarDrag {
  elementId: string
  emoji: string
  name: string
  startX: number
  startY: number
}

interface SidebarProps {
  onDropToWorkspace?: (elementId: string, screenX: number, screenY: number) => void
}

export default function Sidebar({ onDropToWorkspace }: SidebarProps) {
  const elements = useElementStore(s => s.elements)
  const allElements = useMemo(() => Object.values(elements), [elements])
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('time')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [sidebarDrag, setSidebarDrag] = useState<SidebarDrag | null>(null)

  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    allElements.forEach(el => el.categories.forEach(c => cats.add(c)))
    return Array.from(cats).sort()
  }, [allElements])

  const filteredElements = useMemo(() => {
    let result = allElements

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        e =>
          e.name.toLowerCase().includes(q) ||
          e.categories.some(c => c.toLowerCase().includes(q)),
      )
    }

    if (activeCategory) {
      result = result.filter(e => e.categories.includes(activeCategory))
    }

    result = [...result].sort((a, b) => {
      if (sortMode === 'name') return a.name.localeCompare(b.name, 'zh-CN')
      return b.discoveredAt - a.discoveredAt || a.name.localeCompare(b.name, 'zh-CN')
    })

    return result
  }, [allElements, search, activeCategory, sortMode])

  const handleSidebarPointerDown = useCallback(
    (e: React.PointerEvent, el: { id: string; emoji: string; name: string }) => {
      if (e.button !== 0) return
      e.preventDefault()

      setSidebarDrag({ elementId: el.id, emoji: el.emoji, name: el.name, startX: e.clientX, startY: e.clientY })

      const onUp = (ue: PointerEvent) => {
        setSidebarDrag(null)
        onDropToWorkspace?.(el.id, ue.clientX, ue.clientY)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointerup', onUp)
    },
    [onDropToWorkspace],
  )

  if (collapsed) {
    return (
      <div className="h-full w-full bg-white border-r border-gray-200 md:w-10 flex flex-col items-center pt-4">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          title="展开元素库"
        >
          <ChevronRight />
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="h-full w-full bg-white border-r border-gray-200 md:w-64 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-700">元素库</h2>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
            title="收起"
          >
            <ChevronLeft />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <input
            type="text"
            placeholder="搜索元素..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200
                       bg-gray-50 focus:bg-white focus:border-blue-400 focus:outline-none
                       transition-colors placeholder:text-gray-400"
          />
        </div>

        {/* Sort toggle */}
        <div className="px-3 pb-1 flex gap-1">
          <SortButton active={sortMode === 'time'} onClick={() => setSortMode('time')}>
            按时间
          </SortButton>
          <SortButton active={sortMode === 'name'} onClick={() => setSortMode('name')}>
            按名称
          </SortButton>
        </div>

        {/* Category filter */}
        <div className="px-3 py-1.5 flex flex-wrap gap-1">
          <CategoryTag
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          >
            全部
          </CategoryTag>
          {allCategories.map(cat => (
            <CategoryTag
              key={cat}
              active={activeCategory === cat}
              onClick={() =>
                setActiveCategory(prev => (prev === cat ? null : cat))
              }
            >
              {cat}
            </CategoryTag>
          ))}
        </div>

        {/* Element list */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="flex flex-col gap-1.5">
            <AnimatePresence mode="popLayout">
              {filteredElements.map(el => {
                const recentlyDiscovered = !el.isBase && Date.now() - el.discoveredAt < 10000

                return (
                  <motion.div
                    key={el.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ElementCard
                      emoji={el.emoji}
                      name={el.name}
                      size="sm"
                      isNew={recentlyDiscovered}
                      className={recentlyDiscovered ? 'ring-2 ring-amber-300 bg-amber-50/80' : ''}
                      onPointerDown={e => handleSidebarPointerDown(e, el)}
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {filteredElements.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">
                没有找到匹配的元素
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-500 text-center">
          已发现 <span className="font-bold text-gray-700">{allElements.length}</span> 种元素
        </div>
      </div>

      {/* Drag overlay for sidebar → workspace drag */}
      {sidebarDrag && (
        <DragOverlay
          emoji={sidebarDrag.emoji}
          name={sidebarDrag.name}
          active={!!sidebarDrag}
          initialX={sidebarDrag.startX}
          initialY={sidebarDrag.startY}
        />
      )}
    </>
  )
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700 font-medium'
          : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

function CategoryTag({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
        active
          ? 'bg-blue-500 text-white border-blue-500'
          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
      }`}
    >
      {children}
    </button>
  )
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}
