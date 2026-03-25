import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import ElementCard from './ElementCard'

interface DragOverlayProps {
  emoji: string
  name: string
  active: boolean
  initialX: number
  initialY: number
}

export default function DragOverlay({ emoji, name, active, initialX, initialY }: DragOverlayProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: initialX, y: initialY })

  useEffect(() => {
    posRef.current = { x: initialX, y: initialY }
    if (elRef.current) {
      elRef.current.style.left = `${initialX}px`
      elRef.current.style.top = `${initialY}px`
    }
  }, [initialX, initialY])

  useEffect(() => {
    if (!active) return
    const onMove = (e: PointerEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      if (elRef.current) {
        elRef.current.style.left = `${e.clientX}px`
        elRef.current.style.top = `${e.clientY}px`
      }
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [active])

  if (!active) return null

  return createPortal(
    <div
      ref={elRef}
      className="fixed pointer-events-none z-[200]"
      style={{
        left: initialX,
        top: initialY,
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
