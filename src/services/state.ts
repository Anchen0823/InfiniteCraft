import type {
  AIConfig,
  AppStatePayload,
  SettingsPayload,
  WorkspaceStateSnapshot,
} from '../types'

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json() as { message?: string }
    return payload.message || `请求失败: ${response.status}`
  } catch {
    return `请求失败: ${response.status}`
  }
}

export async function loadAppState(): Promise<AppStatePayload> {
  const response = await fetch('/api/state')
  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response.json() as Promise<AppStatePayload>
}

export async function saveWorkspaceState(workspace: WorkspaceStateSnapshot): Promise<void> {
  const response = await fetch('/api/state/workspace', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workspace),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }
}

export async function saveSettings(input: {
  aiConfig?: Partial<AIConfig>
  craftCount?: number
}): Promise<SettingsPayload> {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response.json() as Promise<SettingsPayload>
}

export async function importAppState(payload: AppStatePayload): Promise<AppStatePayload> {
  const response = await fetch('/api/state/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response.json() as Promise<AppStatePayload>
}

export async function resetAppState(): Promise<AppStatePayload> {
  const response = await fetch('/api/state/reset', {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response.json() as Promise<AppStatePayload>
}
