import { useRef, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Workspace, { type WorkspaceHandle } from './components/Workspace'

function App() {
  const workspaceRef = useRef<WorkspaceHandle>(null)

  const handleDropToWorkspace = useCallback(
    (elementId: string, screenX: number, screenY: number) => {
      workspaceRef.current?.handleDropFromSidebar(elementId, screenX, screenY)
    },
    [],
  )

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar onDropToWorkspace={handleDropToWorkspace} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
          <span className="text-lg font-bold text-gray-800">🧪 无尽炼金</span>
        </div>

        <Workspace ref={workspaceRef} />
      </div>
    </div>
  )
}

export default App
