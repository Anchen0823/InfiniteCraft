import { useEffect, useRef, useState } from 'react'
import { importAppState, loadAppState, resetAppState } from '../services/state'
import { useSettingsStore } from '../store/settingsStore'
import { useElementStore } from '../store/elementStore'
import { useRecipeStore } from '../store/recipeStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import type { AppStatePayload } from '../types'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void
}

function applyAppState(payload: AppStatePayload) {
  useElementStore.getState().replaceAll(payload.elements)
  useRecipeStore.getState().replaceAll(payload.recipes)
  useWorkspaceStore.getState().replaceAll(payload.workspace)
  useSettingsStore.getState().replaceAll(payload.settings)
}

export default function SettingsModal({ open, onClose, onNotify }: SettingsModalProps) {
  const aiConfig = useSettingsStore(s => s.aiConfig)
  const hasApiKey = useSettingsStore(s => s.hasApiKey)
  const updateConfig = useSettingsStore(s => s.updateConfig)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [baseUrl, setBaseUrl] = useState(aiConfig.baseUrl)
  const [model, setModel] = useState(aiConfig.model)
  const [timeoutMs, setTimeoutMs] = useState(String(aiConfig.timeoutMs))
  const [busyAction, setBusyAction] = useState<'import' | 'reset' | null>(null)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [confirmResetText, setConfirmResetText] = useState('')

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

    onNotify?.('模型配置已保存', 'success')
    onClose()
  }

  const handleExport = async () => {
    try {
      const payload = await loadAppState()
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      link.href = url
      link.download = `infinite-craft-backup-${timestamp}.json`
      link.click()
      URL.revokeObjectURL(url)
      onNotify?.('数据已导出为 JSON 文件', 'success')
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : '导出数据失败', 'error')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      setBusyAction('import')
      const text = await file.text()
      const payload = JSON.parse(text) as AppStatePayload
      const nextState = await importAppState(payload)
      applyAppState(nextState)
      onNotify?.('数据导入成功', 'success')
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : '导入数据失败', 'error')
    } finally {
      setBusyAction(null)
    }
  }

  const handleReset = async () => {
    try {
      setBusyAction('reset')
      const nextState = await resetAppState()
      applyAppState(nextState)
      onNotify?.('数据已重置，已恢复到初始五行元素', 'success')
      setConfirmResetOpen(false)
      setConfirmResetText('')
    } catch (error) {
      onNotify?.(error instanceof Error ? error.message : '重置数据失败', 'error')
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:px-4">
      <div className="flex h-full w-full max-w-2xl flex-col rounded-2xl border border-gray-200 bg-white shadow-xl sm:h-auto sm:max-h-[calc(100dvh-2rem)]">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
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

        <div className="min-h-0 flex-1 overflow-auto px-4 py-4 space-y-6 sm:px-5">
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

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-800">数据管理</h3>
            <p className="mt-1 text-sm text-gray-500">
              可导出当前进度为 JSON 备份，也可导入备份恢复游戏数据。
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                导出数据
              </button>

              <button
                type="button"
                onClick={handleImportClick}
                disabled={busyAction === 'import'}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-60"
              >
                {busyAction === 'import' ? '导入中...' : '导入数据'}
              </button>

              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                disabled={busyAction === 'reset'}
                className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-60"
              >
                {busyAction === 'reset' ? '重置中...' : '重置数据'}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportChange}
            />

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              SQLite 备份说明：如果你部署在默认配置下，建议定期备份服务器上的
              <code className="mx-1 rounded bg-white/70 px-1 py-0.5">.data/infinite-craft.db</code>
              文件；导出 JSON 可作为应用层备份，数据库文件可作为完整备份。
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
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

      {confirmResetOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">二次确认重置</h3>
            <p className="mt-2 text-sm text-gray-600">
              这会清空所有已发现元素、配方和工作台内容，仅保留当前模型配置与五行基础元素。
            </p>
            <p className="mt-2 text-sm text-gray-600">
              请输入
              <code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 text-rose-700">重置</code>
              以确认操作。
            </p>

            <input
              type="text"
              value={confirmResetText}
              onChange={event => setConfirmResetText(event.target.value)}
              className="mt-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
              placeholder="输入“重置”确认"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmResetOpen(false)
                  setConfirmResetText('')
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={busyAction === 'reset' || confirmResetText.trim() !== '重置'}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyAction === 'reset' ? '重置中...' : '确认重置'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
