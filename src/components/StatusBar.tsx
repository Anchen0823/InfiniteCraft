import { useMemo } from 'react'
import { useElementStore } from '../store/elementStore'
import { useSettingsStore } from '../store/settingsStore'
import { useWorkspaceStore } from '../store/workspaceStore'

export default function StatusBar() {
  const elementCount = useElementStore(s => Object.keys(s.elements).length)
  const craftCount = useSettingsStore(s => s.craftCount)
  const workspaceItemCount = useWorkspaceStore(s => s.items.length)
  const statusItems = useMemo(() => ([
    `已发现 ${elementCount} 种元素`,
    `合成次数 ${craftCount}`,
    `工作台 ${workspaceItemCount} 个元素`,
  ]), [elementCount, craftCount, workspaceItemCount])

  return (
    <div className="min-h-10 border-t border-gray-200 bg-white/95 px-3 py-2 text-xs text-gray-500 backdrop-blur sm:px-4">
      <div className="flex flex-wrap items-center gap-2">
        {statusItems.map(item => (
          <span key={item} className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
