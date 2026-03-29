import { useMemo } from 'react'
import { useElementStore } from '../store/elementStore'
import { useSettingsStore } from '../store/settingsStore'
import { useWorkspaceStore } from '../store/workspaceStore'

export default function StatusBar() {
  const elementCount = useElementStore(s => Object.keys(s.elements).length)
  const craftCount = useSettingsStore(s => s.craftCount)
  const workspaceItemCount = useWorkspaceStore(s => s.items.length)

  const statusText = useMemo(() => {
    return [
      `已发现 ${elementCount} 种元素`,
      `合成次数 ${craftCount}`,
      `工作台 ${workspaceItemCount} 个元素`,
    ].join(' | ')
  }, [elementCount, craftCount, workspaceItemCount])

  return (
    <div className="min-h-10 border-t border-gray-200 bg-white/95 px-4 py-2 text-xs text-gray-500 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-medium text-gray-700">{statusText}</span>
        <span className="text-gray-400 sm:hidden">小屏幕建议横屏或桌面端体验</span>
      </div>
    </div>
  )
}
