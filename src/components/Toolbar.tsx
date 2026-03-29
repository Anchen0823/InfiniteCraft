interface ToolbarProps {
  hasApiKey: boolean
  onOpenEncyclopedia: () => void
  onOpenRecipes: () => void
  onOpenCraftTree: () => void
  onOpenSettings: () => void
}

export default function Toolbar({
  hasApiKey,
  onOpenEncyclopedia,
  onOpenRecipes,
  onOpenCraftTree,
  onOpenSettings,
}: ToolbarProps) {
  return (
    <div className="min-h-12 bg-white border-b border-gray-200 flex flex-wrap items-center px-4 py-2 gap-2 shrink-0">
      <span className="text-lg font-bold text-gray-800">🧪 无尽炼金</span>

      <div className="ml-0 flex flex-wrap items-center gap-2 md:ml-3">
        <ToolbarButton label="图鉴" onClick={onOpenEncyclopedia} />
        <ToolbarButton label="配方表" onClick={onOpenRecipes} />
        <ToolbarButton label="合成树" onClick={onOpenCraftTree} />
        <ToolbarButton label="设置" onClick={onOpenSettings} />
      </div>

      <span className={`ml-auto text-xs px-2 py-1 rounded-full border ${
        hasApiKey
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}>
        {hasApiKey ? 'AI 已就绪' : 'AI Key 未配置'}
      </span>
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
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
    >
      {label}
    </button>
  )
}
