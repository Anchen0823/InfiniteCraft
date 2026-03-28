import { useEffect, useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const aiConfig = useSettingsStore(s => s.aiConfig)
  const hasApiKey = useSettingsStore(s => s.hasApiKey)
  const updateConfig = useSettingsStore(s => s.updateConfig)

  const [baseUrl, setBaseUrl] = useState(aiConfig.baseUrl)
  const [model, setModel] = useState(aiConfig.model)
  const [timeoutMs, setTimeoutMs] = useState(String(aiConfig.timeoutMs))

  useEffect(() => {
    if (!open) return

    setBaseUrl(aiConfig.baseUrl)
    setModel(aiConfig.model)
    setTimeoutMs(String(aiConfig.timeoutMs))
  }, [open, aiConfig])

  if (!open) return null

  const handleSave = () => {
    const nextTimeout = Number.parseInt(timeoutMs, 10)
    if (!baseUrl.trim() || !model.trim() || !Number.isFinite(nextTimeout)) {
      alert('请填写有效的 Base URL、模型名称和超时时间')
      return
    }

    updateConfig({
      baseUrl: baseUrl.trim(),
      model: model.trim(),
      timeoutMs: Math.max(1000, nextTimeout),
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">AI 设置</h2>
            <p className="text-sm text-gray-500 mt-1">前端只保存模型配置，API Key 由服务器环境变量提供。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            关闭
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className={`rounded-xl border px-3 py-2 text-sm ${
            hasApiKey
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}>
            {hasApiKey
              ? '服务器已检测到 OPENAI_API_KEY，可以发起新的 AI 合成。'
              : '服务器尚未配置 OPENAI_API_KEY，只能使用已有配方缓存。'}
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">API Base URL</span>
            <input
              type="text"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">模型名称</span>
            <input
              type="text"
              value={model}
              onChange={e => setModel(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">超时时间（毫秒）</span>
            <input
              type="number"
              min={1000}
              step={1000}
              value={timeoutMs}
              onChange={e => setTimeoutMs(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
