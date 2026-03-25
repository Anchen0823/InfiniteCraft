import Sidebar from './components/Sidebar'
import Workspace from './components/Workspace'

function App() {
  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
          <span className="text-lg font-bold text-gray-800">🧪 无尽炼金</span>
        </div>

        <Workspace />
      </div>
    </div>
  )
}

export default App
