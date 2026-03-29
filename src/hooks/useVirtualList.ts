import { useEffect, useMemo, useRef, useState } from 'react'

interface UseVirtualListOptions {
  itemCount: number
  itemHeight: number
  overscan?: number
}

export function useVirtualList({
  itemCount,
  itemHeight,
  overscan = 6,
}: UseVirtualListOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateHeight = () => {
      setViewportHeight(container.clientHeight)
    }

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [])

  const range = useMemo(() => {
    if (itemCount === 0) {
      return {
        start: 0,
        end: 0,
      }
    }

    const visibleCount = Math.max(1, Math.ceil(viewportHeight / itemHeight))
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const end = Math.min(itemCount, start + visibleCount + overscan * 2)

    return { start, end }
  }, [itemCount, itemHeight, overscan, scrollTop, viewportHeight])

  const totalHeight = itemCount * itemHeight
  const offsetTop = range.start * itemHeight

  return {
    containerRef,
    start: range.start,
    end: range.end,
    totalHeight,
    offsetTop,
    onScroll: (event: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(event.currentTarget.scrollTop)
    },
  }
}
