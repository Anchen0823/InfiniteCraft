import { useMemo, useState } from 'react'
import { useVirtualList } from '../hooks/useVirtualList'
import { useElementStore } from '../store/elementStore'
import { useRecipeStore } from '../store/recipeStore'

interface EncyclopediaProps {
  open: boolean
  onClose: () => void
}

function formatTimestamp(timestamp: number) {
  if (!timestamp) return '基础元素'

  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ROW_HEIGHT = 88

export default function Encyclopedia({ open, onClose }: EncyclopediaProps) {
  const elementMap = useElementStore(s => s.elements)
  const recipes = useRecipeStore(s => s.recipes)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const elements = useMemo(() => Object.values(elementMap), [elementMap])

  const allCategories = useMemo(() => {
    const categories = new Set<string>()
    for (const element of elements) {
      for (const category of element.categories) {
        categories.add(category)
      }
    }

    return Array.from(categories).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }, [elements])

  const recipeMap = useMemo(() => {
    return new Map(recipes.filter(recipe => recipe.resultId).map(recipe => [recipe.resultId as string, recipe]))
  }, [recipes])

  const filteredElements = useMemo(() => {
    const query = search.trim().toLowerCase()

    return [...elements]
      .filter(element => {
        const matchesQuery = !query || element.name.toLowerCase().includes(query)
        const matchesCategory = !activeCategory || element.categories.includes(activeCategory)
        return matchesQuery && matchesCategory
      })
      .sort((a, b) => b.discoveredAt - a.discoveredAt || a.name.localeCompare(b.name, 'zh-CN'))
  }, [elements, search, activeCategory])

  const virtualList = useVirtualList({
    itemCount: filteredElements.length,
    itemHeight: ROW_HEIGHT,
  })

  const visibleElements = useMemo(
    () => filteredElements.slice(virtualList.start, virtualList.end),
    [filteredElements, virtualList.start, virtualList.end],
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/40 p-2 sm:p-4" onClick={onClose}>
      <div
        className="mx-auto flex h-full w-full max-w-6xl flex-col rounded-2xl border border-gray-200 bg-white shadow-xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">元素图鉴</h2>
            <p className="mt-1 text-sm text-gray-500">查看所有已发现元素、类别和首次发现方式。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            关闭
          </button>
        </div>

        <div className="border-b border-gray-100 px-4 py-4 space-y-3 sm:px-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="按名称搜索元素..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none md:max-w-sm"
            />
            <div className="text-sm text-gray-500">
              共 <span className="font-semibold text-gray-700">{filteredElements.length}</span> / {elements.length} 个元素
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <CategoryChip
              label="全部"
              active={activeCategory === null}
              onClick={() => setActiveCategory(null)}
            />
            {allCategories.map(category => (
              <CategoryChip
                key={category}
                label={category}
                active={activeCategory === category}
                onClick={() => setActiveCategory(prev => (prev === category ? null : category))}
              />
            ))}
          </div>
        </div>

        <div
          ref={virtualList.containerRef}
          onScroll={virtualList.onScroll}
          className="min-h-0 flex-1 overflow-auto"
        >
          {filteredElements.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              没有匹配的元素
            </div>
          ) : (
            <div className="min-w-[54rem]">
              <div className="grid grid-cols-[2fr_1.2fr_1fr_1.4fr] border-b border-gray-100 bg-gray-50 px-4 py-3 text-left text-sm text-gray-500 sm:px-5">
                <div className="font-medium">元素</div>
                <div className="font-medium">类别</div>
                <div className="font-medium">发现时间</div>
                <div className="font-medium">发现方式</div>
              </div>

              <div style={{ height: virtualList.totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${virtualList.offsetTop}px)` }}>
                  {visibleElements.map(element => {
                    const recipe = recipeMap.get(element.id)

                    return (
                      <div
                        key={element.id}
                        className="grid grid-cols-[2fr_1.2fr_1fr_1.4fr] border-t border-gray-100 px-4 py-4 text-sm sm:px-5"
                        style={{ minHeight: `${ROW_HEIGHT}px` }}
                      >
                        <div className="flex items-center gap-3 pr-4">
                          <span className="text-2xl">{element.emoji}</span>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-800">{element.name}</div>
                            {element.isBase && (
                              <div className="mt-1 text-xs text-amber-600">基础元素</div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap content-start gap-1.5 pr-4">
                          {element.categories.map(category => (
                            <span
                              key={category}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                            >
                              {category}
                            </span>
                          ))}
                        </div>

                        <div className="pr-4 text-gray-600">{formatTimestamp(element.discoveredAt)}</div>

                        <div className="text-gray-600">
                          {recipe
                            ? `${recipe.inputA} + ${recipe.inputB} -> ${element.name}`
                            : '初始解锁'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? 'border-blue-500 bg-blue-500 text-white'
          : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
      }`}
    >
      {label}
    </button>
  )
}
