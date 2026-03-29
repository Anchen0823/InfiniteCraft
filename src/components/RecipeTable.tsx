import { useMemo, useState } from 'react'
import { useVirtualList } from '../hooks/useVirtualList'
import { useElementStore } from '../store/elementStore'
import { useRecipeStore } from '../store/recipeStore'

interface RecipeTableProps {
  open: boolean
  onClose: () => void
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ROW_HEIGHT = 84

export default function RecipeTable({ open, onClose }: RecipeTableProps) {
  const recipes = useRecipeStore(s => s.recipes)
  const elements = useElementStore(s => s.elements)
  const [search, setSearch] = useState('')
  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  const recipeRows = useMemo(() => {
    return [...recipes]
      .map(recipe => ({
        recipe,
        resultElement: recipe.resultId ? elements[recipe.resultId] : undefined,
      }))
      .sort((a, b) => b.recipe.discoveredAt - a.recipe.discoveredAt)
  }, [recipes, elements])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    return recipeRows.filter(({ recipe, resultElement }) => {
      const keywords = [
        recipe.inputA,
        recipe.inputB,
        resultElement?.name ?? '无法合成',
      ].join(' ').toLowerCase()

      const matchesQuery = !query || keywords.includes(query)
      const matchesSelected = !selectedElement || [
        recipe.inputA,
        recipe.inputB,
        resultElement?.name,
      ].includes(selectedElement)

      return matchesQuery && matchesSelected
    })
  }, [recipeRows, search, selectedElement])

  const relatedRecipes = useMemo(() => {
    if (!selectedElement) return null

    const produces = recipeRows.filter(({ resultElement }) => resultElement?.name === selectedElement)
    const uses = recipeRows.filter(({ recipe }) => recipe.inputA === selectedElement || recipe.inputB === selectedElement)

    return { produces, uses }
  }, [recipeRows, selectedElement])

  const virtualList = useVirtualList({
    itemCount: filteredRows.length,
    itemHeight: ROW_HEIGHT,
  })

  const visibleRows = useMemo(
    () => filteredRows.slice(virtualList.start, virtualList.end),
    [filteredRows, virtualList.start, virtualList.end],
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/40 p-4" onClick={onClose}>
      <div
        className="mx-auto flex h-full max-w-6xl flex-col rounded-2xl border border-gray-200 bg-white shadow-xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">配方表</h2>
            <p className="mt-1 text-sm text-gray-500">搜索配方，并查看某个元素的来源与去向。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            关闭
          </button>
        </div>

        <div className="border-b border-gray-100 px-5 py-4 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="搜索元素名称或配方结果..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none md:max-w-sm"
            />
            <div className="text-sm text-gray-500">
              共 <span className="font-semibold text-gray-700">{filteredRows.length}</span> / {recipeRows.length} 条配方
            </div>
          </div>

          {selectedElement && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">当前查看元素：</span>
              <button
                type="button"
                onClick={() => setSelectedElement(null)}
                className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                {selectedElement} · 清除筛选
              </button>
            </div>
          )}
        </div>

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1.6fr_1fr]">
          <div className="min-h-0 border-r border-gray-100">
            {filteredRows.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                没有匹配的配方
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-gray-50 px-5 py-3 text-left text-sm text-gray-500">
                  <div className="font-medium">配方</div>
                  <div className="font-medium">结果</div>
                  <div className="font-medium">发现时间</div>
                </div>

                <div
                  ref={virtualList.containerRef}
                  onScroll={virtualList.onScroll}
                  className="h-full overflow-auto"
                >
                  <div style={{ height: virtualList.totalHeight, position: 'relative' }}>
                    <div style={{ transform: `translateY(${virtualList.offsetTop}px)` }}>
                      {visibleRows.map(({ recipe, resultElement }) => (
                        <div
                          key={recipe.id}
                          className="grid grid-cols-[1.5fr_1fr_1fr] border-t border-gray-100 px-5 py-4 text-sm"
                          style={{ minHeight: `${ROW_HEIGHT}px` }}
                        >
                          <div className="pr-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <ElementLink name={recipe.inputA} onClick={setSelectedElement} />
                              <span className="text-gray-400">+</span>
                              <ElementLink name={recipe.inputB} onClick={setSelectedElement} />
                            </div>
                          </div>

                          <div className="pr-4">
                            {resultElement ? (
                              <button
                                type="button"
                                onClick={() => setSelectedElement(resultElement.name)}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              >
                                <span>{resultElement.emoji}</span>
                                <span>{resultElement.name}</span>
                              </button>
                            ) : (
                              <span className="text-gray-400">无法合成</span>
                            )}
                          </div>

                          <div className="text-gray-600">{formatTimestamp(recipe.discoveredAt)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="min-h-0 overflow-auto px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-800">反向查询</h3>

            {!selectedElement || !relatedRecipes ? (
              <p className="mt-3 text-sm text-gray-400">
                点击表格中的任意元素名称，即可查看它的来源配方和后续参与的配方。
              </p>
            ) : (
              <div className="mt-3 space-y-5">
                <div>
                  <div className="text-sm font-medium text-gray-700">当前元素</div>
                  <div className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                    {selectedElement}
                  </div>
                </div>

                <section>
                  <div className="text-sm font-medium text-gray-700">哪些配方产出它</div>
                  <div className="mt-2 space-y-2">
                    {relatedRecipes.produces.length === 0 ? (
                      <p className="text-sm text-gray-400">没有找到产出该元素的配方，可能是基础元素。</p>
                    ) : (
                      relatedRecipes.produces.map(({ recipe }) => (
                        <div key={recipe.id} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          {recipe.inputA} + {recipe.inputB}
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section>
                  <div className="text-sm font-medium text-gray-700">它参与了哪些配方</div>
                  <div className="mt-2 space-y-2">
                    {relatedRecipes.uses.length === 0 ? (
                      <p className="text-sm text-gray-400">没有找到该元素参与的配方。</p>
                    ) : (
                      relatedRecipes.uses.map(({ recipe, resultElement }) => (
                        <div key={recipe.id} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          {`${recipe.inputA} + ${recipe.inputB} -> ${resultElement?.name ?? '无法合成'}`}
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ElementLink({
  name,
  onClick,
}: {
  name: string
  onClick: (name: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(name)}
      className="rounded-lg bg-blue-50 px-3 py-1.5 text-blue-700 hover:bg-blue-100 transition-colors"
    >
      {name}
    </button>
  )
}
