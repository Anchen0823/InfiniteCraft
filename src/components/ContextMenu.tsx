import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface ContextMenuItem {
  label: string
  icon?: string
  danger?: boolean
  onClick: () => void
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  visible: boolean
  onClose: () => void
}

export default function ContextMenu({ x, y, items, visible, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [visible, onClose])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={menuRef}
          className="fixed z-[100] min-w-[140px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 overflow-hidden"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.1 }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.onClick()
                onClose()
              }}
              className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                item.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
