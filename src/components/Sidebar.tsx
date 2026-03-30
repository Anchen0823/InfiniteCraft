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
  mode?: 'desktop' | 'mobile'
  onDropToWorkspace?: (elementId: string, screenX: number, screenY: number) => void
}

export default function Sidebar({
  mode = 'desktop',
  onDropToWorkspace,
}: SidebarProps) {
  const elements = useElementStore(s => s.elements)
  const allElements = useMemo(() => Object.values(elements), [elements])
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('time')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [sidebarDrag, setSidebarDrag] = useState<SidebarDrag | null>(null)
  const isMobile = mode === 'mobile'

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

  const handleCategoryChange = useCallback(
    (category: string | null) => {
      setActiveCategory(prev => {
        if (category === null) return null
        return prev === category ? null : category
      })

      if (isMobile) {
        setMobileFiltersOpen(false)
      }
    },
    [isMobile],
  )

  if (!isMobile && collapsed) {
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
      <div className={`h-full w-full bg-white flex flex-col overscroll-none ${isMobile ? 'rounded-t-3xl' : 'border-r border-gray-200 md:w-64'}`}>
        {/* Header */}
        {isMobile ? null : (
          <div className="border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-gray-700">元素库</h2>
                <p className="mt-1 text-xs text-gray-400">拖拽元素到工作台进行合成</p>
              </div>

              <button
                onClick={() => setCollapsed(true)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
                title="收起"
              >
                <ChevronLeft />
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className={`px-3 ${isMobile ? 'pt-2 pb-2' : 'py-2'}`}>
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
        {isMobile ? (
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl bg-gray-100 p-0.5">
                <SortButton
                  active={sortMode === 'time'}
                  compact
                  onClick={() => setSortMode('time')}
                >
                  时间
                </SortButton>
                <SortButton
                  active={sortMode === 'name'}
                  compact
                  onClick={() => setSortMode('name')}
                >
                  名称
                </SortButton>
              </div>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(prev => !prev)}
                aria-expanded={mobileFiltersOpen}
                className={`ml-auto inline-flex max-w-[10rem] items-center gap-1 rounded-xl border px-2.5 py-1 text-xs transition-colors ${
                  activeCategory
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-500'
                }`}
              >
                <FilterIcon />
                <span className="truncate">{activeCategory ?? '全部分类'}</span>
                <ChevronDown className={mobileFiltersOpen ? 'rotate-180' : ''} />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {mobileFiltersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-1.5 overflow-x-auto pt-2 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <CategoryTag
                      active={activeCategory === null}
                      compact
                      onClick={() => handleCategoryChange(null)}
                    >
                      全部
                    </CategoryTag>
                    {allCategories.map(cat => (
                      <CategoryTag
                        key={cat}
                        active={activeCategory === cat}
                        compact
                        onClick={() => handleCategoryChange(cat)}
                      >
                        {cat}
                      </CategoryTag>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <>
            <div className="px-3 pb-1 flex gap-1">
              <SortButton active={sortMode === 'time'} onClick={() => setSortMode('time')}>
                按时间
              </SortButton>
              <SortButton active={sortMode === 'name'} onClick={() => setSortMode('name')}>
                按名称
              </SortButton>
            </div>

            <div className="px-3 py-1.5 flex flex-wrap gap-1 overflow-y-auto">
              <CategoryTag
                active={activeCategory === null}
                onClick={() => handleCategoryChange(null)}
              >
                全部
              </CategoryTag>
              {allCategories.map(cat => (
                <CategoryTag
                  key={cat}
                  active={activeCategory === cat}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                </CategoryTag>
              ))}
            </div>
          </>
        )}

        {/* Element list */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className={isMobile ? 'flex flex-wrap content-start gap-2' : 'flex flex-col gap-1.5'}>
            <AnimatePresence mode="popLayout">
              {filteredElements.map(el => {
                const recentlyDiscovered = !el.isBase && Date.now() - el.discoveredAt < 10000

                return (
                  <motion.div
                    key={el.id}
                    className={isMobile ? 'shrink-0' : ''}
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
        {!isMobile && (
          <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-500 text-center">
            已发现 <span className="font-bold text-gray-700">{allElements.length}</span> 种元素
          </div>
        )}
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
  compact = false,
  onClick,
  children,
}: {
  active: boolean
  compact?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`${compact ? 'px-3 py-1 rounded-lg' : 'px-2 py-0.5 rounded-md'} text-xs transition-colors ${
        active
          ? compact
            ? 'bg-white text-gray-700 font-semibold shadow-sm'
            : 'bg-blue-100 text-blue-700 font-medium'
          : compact
            ? 'text-gray-500'
          : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

function CategoryTag({
  active,
  compact = false,
  onClick,
  children,
}: {
  active: boolean
  compact?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`${compact ? 'shrink-0 px-2.5 py-1' : 'px-2 py-0.5'} text-xs rounded-full border transition-colors ${
        active
          ? 'bg-blue-500 text-white border-blue-500'
          : compact
            ? 'bg-gray-50 text-gray-600 border-gray-200'
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

function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${className}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  )
}
