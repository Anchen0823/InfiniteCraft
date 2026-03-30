export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface ToastViewportProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export default function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed left-3 right-3 top-3 z-[70] flex flex-col gap-2 sm:left-auto sm:right-4 sm:top-4 sm:w-[min(24rem,calc(100vw-2rem))]">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : toast.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : 'border-blue-200 bg-blue-50 text-blue-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 text-sm">{toast.message}</div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-md px-1 text-xs text-current/70 hover:bg-black/5"
            >
              关闭
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
