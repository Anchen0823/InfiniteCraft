import type { CraftResponse } from '../types'

export async function craftElements(
  elementA: string,
  elementB: string,
): Promise<CraftResponse> {
  const response = await fetch('/api/craft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      elementA,
      elementB,
    }),
  })

  if (!response.ok) {
    let message = `合成请求失败: ${response.status}`

    try {
      const payload = await response.json() as { message?: string }
      if (payload.message) {
        message = payload.message
      }
    } catch {
      // Ignore JSON parse errors and use the fallback message above.
    }

    throw new Error(message)
  }

  return response.json() as Promise<CraftResponse>
}
