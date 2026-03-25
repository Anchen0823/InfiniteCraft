import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import ElementCard from './ElementCard'

interface DragOverlayProps {
  emoji: string
  name: string
  active: boolean
}

export default function DragOverlay({ emoji, name, active }: DragOverlayProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!active) return
    const onMove = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [active])

  if (!active) return null

  return createPortal(
    <div
      className="fixed pointer-events-none z-[200]"
      style={{
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <ElementCard
        emoji={emoji}
        name={name}
        className="opacity-80 shadow-xl scale-110"
      />
    </div>,
    document.body,
  )
}
