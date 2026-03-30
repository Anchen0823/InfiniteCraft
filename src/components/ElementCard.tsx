import { motion } from 'framer-motion'

interface ElementCardProps {
  emoji: string
  name: string
  isNew?: boolean
  size?: 'sm' | 'md'
  className?: string
  onPointerDown?: (e: React.PointerEvent) => void
}

export default function ElementCard({
  emoji,
  name,
  isNew = false,
  size = 'md',
  className = '',
  onPointerDown,
}: ElementCardProps) {
  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-sm gap-1.5'
      : 'px-4 py-2 text-base gap-2'

  const emojiSize = size === 'sm' ? 'text-base' : 'text-xl'

  return (
    <motion.div
      className={`
        relative inline-flex items-center ${sizeClasses}
        bg-white rounded-xl border border-gray-200
        shadow-sm hover:shadow-md
        cursor-grab active:cursor-grabbing
        select-none touch-none transition-shadow
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onPointerDown={onPointerDown}
    >
      <span className={emojiSize}>{emoji}</span>
      <span className="font-medium text-gray-700 whitespace-nowrap">{name}</span>

      {isNew && (
        <motion.span
          className="absolute -top-2 -right-2 text-xs bg-amber-400 text-white px-1.5 py-0.5 rounded-full font-bold shadow"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          ✨新
        </motion.span>
      )}
    </motion.div>
  )
}
