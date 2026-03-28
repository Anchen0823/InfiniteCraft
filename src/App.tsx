import { useRef, useCallback, useEffect, useState } from 'react'
import Encyclopedia from './components/Encyclopedia'
import RecipeTable from './components/RecipeTable'
import Sidebar from './components/Sidebar'
import SettingsModal from './components/SettingsModal'
import Toolbar from './components/Toolbar'
import Workspace, { type WorkspaceHandle } from './components/Workspace'
import { loadAppState, saveSettings, saveWorkspaceState } from './services/state'
import { useElementStore } from './store/elementStore'
import { useRecipeStore } from './store/recipeStore'
import { useSettingsStore } from './store/settingsStore'
import { useWorkspaceStore } from './store/workspaceStore'

function App() {
  const workspaceRef = useRef<WorkspaceHandle>(null)
  const [isReady, setIsReady] = useState(false)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<'encyclopedia' | 'recipes' | 'settings' | null>(null)
  const hasApiKey = useSettingsStore(s => s.hasApiKey)

  const bootstrap = useCallback(async () => {
    try {
      const payload = await loadAppState()

      useElementStore.getState().replaceAll(payload.elements)
      useRecipeStore.getState().replaceAll(payload.recipes)
      useWorkspaceStore.getState().replaceAll(payload.workspace)
      useSettingsStore.getState().replaceAll(payload.settings)

      setBootstrapError(null)
      setIsReady(true)
    } catch (error) {
      setBootstrapError(error instanceof Error ? error.message : '初始化失败')
      setIsReady(false)
    }
  }, [])

  const handleDropToWorkspace = useCallback(
    (elementId: string, screenX: number, screenY: number) => {
      workspaceRef.current?.handleDropFromSidebar(elementId, screenX, screenY)
    },
    [],
  )

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (!isReady) return

    let timeoutId: number | undefined
    let previousSnapshot = JSON.stringify({
      items: useWorkspaceStore.getState().items,
      scale: useWorkspaceStore.getState().scale,
      panX: useWorkspaceStore.getState().panX,
      panY: useWorkspaceStore.getState().panY,
    })

    const unsubscribe = useWorkspaceStore.subscribe(state => {
      const snapshot = {
        items: state.items,
        scale: state.scale,
        panX: state.panX,
        panY: state.panY,
      }
      const nextSnapshot = JSON.stringify(snapshot)

      if (nextSnapshot === previousSnapshot) {
        return
      }

      previousSnapshot = nextSnapshot

      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        void saveWorkspaceState(snapshot).catch(error => {
          console.error('同步工作台失败:', error)
        })
      }, 300)
    })

    return () => {
      window.clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [isReady])

  useEffect(() => {
    if (!activePanel) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePanel(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activePanel])

  useEffect(() => {
    if (!isReady) return

    let timeoutId: number | undefined
    let previousSnapshot = JSON.stringify({
      aiConfig: useSettingsStore.getState().aiConfig,
      craftCount: useSettingsStore.getState().craftCount,
    })

    const unsubscribe = useSettingsStore.subscribe(state => {
      const nextSettings = {
        aiConfig: state.aiConfig,
        craftCount: state.craftCount,
      }
      const nextSnapshot = JSON.stringify(nextSettings)

      if (nextSnapshot === previousSnapshot) {
        return
      }

      previousSnapshot = nextSnapshot

      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        void saveSettings(nextSettings)
          .then(settings => {
            useSettingsStore.getState().setHasApiKey(settings.hasApiKey)
          })
          .catch(error => {
            console.error('同步设置失败:', error)
          })
      }, 400)
    })

    return () => {
      window.clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [isReady])

  if (!isReady) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 w-full max-w-md">
          <h1 className="text-lg font-bold text-gray-800">无尽炼金</h1>
          <p className="mt-2 text-sm text-gray-500">
            {bootstrapError ? `初始化失败：${bootstrapError}` : '正在连接服务器并加载游戏数据...'}
          </p>
          {bootstrapError && (
            <button
              type="button"
              onClick={() => void bootstrap()}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar onDropToWorkspace={handleDropToWorkspace} />

      <div className="flex-1 flex flex-col min-w-0">
        <Toolbar
          hasApiKey={hasApiKey}
          onOpenEncyclopedia={() => setActivePanel('encyclopedia')}
          onOpenRecipes={() => setActivePanel('recipes')}
          onOpenSettings={() => setActivePanel('settings')}
        />

        <Workspace ref={workspaceRef} />
      </div>

      <Encyclopedia open={activePanel === 'encyclopedia'} onClose={() => setActivePanel(null)} />
      <RecipeTable open={activePanel === 'recipes'} onClose={() => setActivePanel(null)} />
      <SettingsModal open={activePanel === 'settings'} onClose={() => setActivePanel(null)} />
    </div>
  )
}

export default App
