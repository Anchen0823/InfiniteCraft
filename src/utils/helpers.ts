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
