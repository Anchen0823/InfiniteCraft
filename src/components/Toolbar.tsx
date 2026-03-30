interface ToolbarProps {
  hasApiKey: boolean
  onOpenEncyclopedia: () => void
  onOpenRecipes: () => void
  onOpenCraftTree: () => void
  onOpenSettings: () => void
  onToggleSidebar: () => void
  mobileSidebarOpen: boolean
}

export default function Toolbar({
  hasApiKey,
  onOpenEncyclopedia,
  onOpenRecipes,
  onOpenCraftTree,
  onOpenSettings,
  onToggleSidebar,
  mobileSidebarOpen,
}: ToolbarProps) {
  return (
    <div className="shrink-0 border-b border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex items-center rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 md:hidden"
        >
          {mobileSidebarOpen ? '收起元素库' : '元素库'}
        </button>

        <span className="min-w-0 text-base font-bold text-gray-800 sm:text-lg">🧪 无尽炼金</span>

        <span className={`ml-auto hidden rounded-full border px-2.5 py-1 text-xs sm:inline-flex ${
          hasApiKey
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {hasApiKey ? 'AI 已就绪' : 'AI Key 未配置'}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto px-3 pb-3 sm:px-4">
        <ToolbarButton label="图鉴" onClick={onOpenEncyclopedia} />
        <ToolbarButton label="配方表" onClick={onOpenRecipes} />
        <ToolbarButton label="合成树" onClick={onOpenCraftTree} />
        <ToolbarButton label="设置" onClick={onOpenSettings} />
      </div>

      <div className="px-3 pb-3 sm:hidden">
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${
          hasApiKey
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {hasApiKey ? 'AI 已就绪' : 'AI Key 未配置'}
        </span>
      </div>
    </div>
  )
}

function ToolbarButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`打开${label}`}
      className="shrink-0 rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
    >
      {label}
    </button>
  )
}
