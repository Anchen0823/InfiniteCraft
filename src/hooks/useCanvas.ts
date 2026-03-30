import { useCallback, useEffect, useRef } from 'react'
import { useWorkspaceStore } from '../store/workspaceStore'

export function useCanvas(containerRef: React.RefObject<HTMLDivElement | null>) {
  const { scale, panX, panY, setScale, setPan } = useWorkspaceStore()
  const isPanning = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const spacePressed = useRef(false)
  const activeTouches = useRef(new Map<number, { x: number; y: number }>())
  const scaleRef = useRef(scale)
  const panRef = useRef({ x: panX, y: panY })
  const gestureRef = useRef<{
    startDistance: number
    startScale: number
    startPanX: number
    startPanY: number
    startCenterX: number
    startCenterY: number
  } | null>(null)

  useEffect(() => {
    scaleRef.current = scale
  }, [scale])

  useEffect(() => {
    panRef.current = { x: panX, y: panY }
  }, [panX, panY])

  const getTouchStats = useCallback(() => {
    const touches = Array.from(activeTouches.current.values())
    if (touches.length < 2) return null

    const [first, second] = touches
    const centerX = (first.x + second.x) / 2
    const centerY = (first.y + second.y) / 2
    const distance = Math.hypot(second.x - first.x, second.y - first.y)

    return { centerX, centerY, distance }
  }, [])

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const currentScale = scaleRef.current
      const currentPan = panRef.current
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.min(2, Math.max(0.25, currentScale * zoomFactor))

      const newPanX = mouseX - ((mouseX - currentPan.x) / currentScale) * newScale
      const newPanY = mouseY - ((mouseY - currentPan.y) / currentScale) * newScale

      scaleRef.current = newScale
      panRef.current = { x: newPanX, y: newPanY }
      setScale(newScale)
      setPan(newPanX, newPanY)
    },
    [setScale, setPan, containerRef],
  )

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        activeTouches.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        const stats = getTouchStats()

        if (stats) {
          gestureRef.current = {
            startDistance: stats.distance,
            startScale: scaleRef.current,
            startPanX: panRef.current.x,
            startPanY: panRef.current.y,
            startCenterX: stats.centerX,
            startCenterY: stats.centerY,
          }
        }
        return
      }

      if (e.button === 1 || (e.button === 0 && spacePressed.current)) {
        isPanning.current = true
        lastPointer.current = { x: e.clientX, y: e.clientY }
        const container = containerRef.current
        if (container) container.style.cursor = 'grabbing'
        e.preventDefault()
      }
    },
    [containerRef, getTouchStats],
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (e.pointerType === 'touch' && activeTouches.current.has(e.pointerId)) {
        activeTouches.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        const stats = getTouchStats()

        if (stats && gestureRef.current) {
          const nextScale = Math.min(
            2,
            Math.max(0.25, gestureRef.current.startScale * (stats.distance / gestureRef.current.startDistance)),
          )

          const nextPanX = gestureRef.current.startPanX + (stats.centerX - gestureRef.current.startCenterX)
          const nextPanY = gestureRef.current.startPanY + (stats.centerY - gestureRef.current.startCenterY)
          const adjustedPanX =
            stats.centerX - ((stats.centerX - nextPanX) / gestureRef.current.startScale) * nextScale
          const adjustedPanY =
            stats.centerY - ((stats.centerY - nextPanY) / gestureRef.current.startScale) * nextScale

          scaleRef.current = nextScale
          panRef.current = { x: adjustedPanX, y: adjustedPanY }
          setScale(nextScale)
          setPan(adjustedPanX, adjustedPanY)
          e.preventDefault()
        }
        return
      }

      if (!isPanning.current) return
      const dx = e.clientX - lastPointer.current.x
      const dy = e.clientY - lastPointer.current.y
      lastPointer.current = { x: e.clientX, y: e.clientY }
      const nextPanX = panRef.current.x + dx
      const nextPanY = panRef.current.y + dy
      panRef.current = { x: nextPanX, y: nextPanY }
      setPan(nextPanX, nextPanY)
    },
    [getTouchStats, setPan, setScale],
  )

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      activeTouches.current.delete(e.pointerId)
      if (activeTouches.current.size < 2) {
        gestureRef.current = null
      }
    }

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
    window.addEventListener('pointercancel', handlePointerUp)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [containerRef, handleWheel, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown, handleKeyUp])

  return { scale, panX, panY, isPanning }
}
