import { useEffect, useRef, useState } from 'react'

interface ToolbarProps {
  onOpenEncyclopedia: () => void
  onOpenRecipes: () => void
  onOpenCraftTree: () => void
  onOpenSettings: () => void
}

export default function Toolbar({
  onOpenEncyclopedia,
  onOpenRecipes,
  onOpenCraftTree,
  onOpenSettings,
}: ToolbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mobileMenuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      setMobileMenuOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

  const mobileActions = [
    { label: '图鉴', onClick: onOpenEncyclopedia },
    { label: '配方表', onClick: onOpenRecipes },
    { label: '合成树', onClick: onOpenCraftTree },
    { label: '设置', onClick: onOpenSettings },
  ]

  return (
    <div className="shrink-0 border-b border-gray-200 bg-white">
      <div className="hidden items-center gap-3 px-4 py-3 md:flex">
        <span className="min-w-0 text-lg font-bold text-gray-800">🧪 无尽炼金</span>
        <div className="ml-auto flex gap-2 overflow-x-auto">
          <ToolbarButton label="图鉴" onClick={onOpenEncyclopedia} />
          <ToolbarButton label="配方表" onClick={onOpenRecipes} />
          <ToolbarButton label="合成树" onClick={onOpenCraftTree} />
          <ToolbarButton label="设置" onClick={onOpenSettings} />
        </div>
      </div>

      <div className="relative px-4 py-4 md:hidden" ref={menuRef}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xl font-bold text-gray-800">无尽炼金</div>
            <div className="mt-1 text-xs text-gray-400">移动端工作台</div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(open => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50"
            title="打开功能菜单"
          >
            <MenuIcon />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute right-4 top-[calc(100%-0.25rem)] z-20 flex w-44 flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
            {mobileActions.map(action => (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  action.onClick()
                }}
                className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
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

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
    </svg>
  )
}
