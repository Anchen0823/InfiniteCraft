import { useCallback, useEffect, useRef } from 'react'
import { useWorkspaceStore } from '../store/workspaceStore'

export function useCanvas(containerRef: React.RefObject<HTMLDivElement | null>) {
  const { scale, panX, panY, setScale, setPan } = useWorkspaceStore()
  const isPanning = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const spacePressed = useRef(false)

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.min(2, Math.max(0.25, scale * zoomFactor))

      const newPanX = mouseX - ((mouseX - panX) / scale) * newScale
      const newPanY = mouseY - ((mouseY - panY) / scale) * newScale

      setScale(newScale)
      setPan(newPanX, newPanY)
    },
    [scale, panX, panY, setScale, setPan, containerRef],
  )

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (e.button === 1 || (e.button === 0 && spacePressed.current)) {
        isPanning.current = true
        lastPointer.current = { x: e.clientX, y: e.clientY }
        const container = containerRef.current
        if (container) container.style.cursor = 'grabbing'
        e.preventDefault()
      }
    },
    [containerRef],
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isPanning.current) return
      const dx = e.clientX - lastPointer.current.x
      const dy = e.clientY - lastPointer.current.y
      lastPointer.current = { x: e.clientX, y: e.clientY }
      setPan(panX + dx, panY + dy)
    },
    [panX, panY, setPan],
  )

  const handlePointerUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false
      const container = containerRef.current
      if (container) container.style.cursor = spacePressed.current ? 'grab' : ''
    }
  }, [containerRef])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        spacePressed.current = true
        const container = containerRef.current
        if (container) container.style.cursor = 'grab'
        e.preventDefault()
      }
    },
    [containerRef],
  )

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressed.current = false
        const container = containerRef.current
        if (container) container.style.cursor = ''
      }
    },
    [containerRef],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [containerRef, handleWheel, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown, handleKeyUp])

  return { scale, panX, panY, isPanning }
}
