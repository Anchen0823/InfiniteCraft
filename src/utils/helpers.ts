export function normalizeRecipeKey(a: string, b: string): string {
  return [a, b].sort().join('+')
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function screenToCanvas(
  screenX: number,
  screenY: number,
  pan: { x: number; y: number },
  scale: number,
) {
  return {
    x: (screenX - pan.x) / scale,
    y: (screenY - pan.y) / scale,
  }
}

export function checkOverlap(rectA: DOMRect, rectB: DOMRect): boolean {
  const overlapX = Math.max(0, Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left))
  const overlapY = Math.max(0, Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top))
  const overlapArea = overlapX * overlapY
  const minArea = Math.min(rectA.width * rectA.height, rectB.width * rectB.height)
  return overlapArea > minArea * 0.3
}
