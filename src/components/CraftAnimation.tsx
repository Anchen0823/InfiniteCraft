import { AnimatePresence, motion } from 'framer-motion'
import type { CraftAnimationState } from '../types'

interface CraftAnimationProps {
  animation: CraftAnimationState | null
}

export default function CraftAnimation({ animation }: CraftAnimationProps) {
  return (
    <AnimatePresence mode="wait">
      {animation && (
        <motion.div
          key={animation.id}
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <GhostElement
            item={animation.itemA}
            centerX={animation.centerX}
            centerY={animation.centerY}
            direction={-1}
            delay={0}
          />
          <GhostElement
            item={animation.itemB}
            centerX={animation.centerX}
            centerY={animation.centerY}
            direction={1}
            delay={0.04}
          />

          {animation.phase === 'crafting' && (
            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: animation.centerX + 40, top: animation.centerY + 18 }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            >
              <div className="h-8 w-8 rounded-full border-[3px] border-amber-200 border-t-amber-500 shadow-sm" />
            </motion.div>
          )}

          {animation.phase === 'success' && animation.result && (
            <>
              <motion.div
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-200 bg-white/95 px-5 py-3 shadow-2xl"
                style={{ left: animation.centerX + 40, top: animation.centerY + 18 }}
                initial={{ scale: 0.4, opacity: 0, y: 18 }}
                animate={{ scale: [0.4, 1.18, 1], opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.55, times: [0, 0.7, 1] }}
              >
                <div className="flex items-center gap-2 text-gray-800">
                  <span className="text-2xl">{animation.result.emoji}</span>
                  <span className="text-lg font-semibold">{animation.result.name}</span>
                </div>
              </motion.div>

              {animation.isNewDiscovery && (
                <motion.div
                  className="absolute -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-white shadow-lg"
                  style={{ left: animation.centerX + 40, top: animation.centerY - 46 }}
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  首次发现
                </motion.div>
              )}
            </>
          )}

          {animation.phase === 'failed' && (
            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-50 px-4 py-2 text-xs font-medium text-rose-600 shadow"
              style={{ left: animation.centerX + 40, top: animation.centerY + 18 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, x: [0, -8, 8, -6, 6, 0] }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.45 }}
            >
              合成失败
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function GhostElement({
  item,
  centerX,
  centerY,
  direction,
  delay,
}: {
  item: CraftAnimationState['itemA']
  centerX: number
  centerY: number
  direction: -1 | 1
  delay: number
}) {
  return (
    <motion.div
      className="absolute rounded-xl border border-amber-200 bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm"
      style={{ left: item.x, top: item.y }}
      initial={{ opacity: 0.95, scale: 1, x: 0, y: 0, rotate: 0 }}
      animate={{
        x: centerX - item.x,
        y: centerY - item.y,
        scale: [1, 0.94, 0.82],
        rotate: [0, direction * 8, 0],
        opacity: [0.95, 1, 0.2],
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeInOut', delay }}
    >
      <div className="flex items-center gap-2 text-gray-800">
        <span className="text-xl">{item.emoji}</span>
        <span className="font-medium whitespace-nowrap">{item.name}</span>
      </div>
    </motion.div>
  )
}
