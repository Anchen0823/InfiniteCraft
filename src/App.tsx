import Sidebar from './components/Sidebar'

function App() {
  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area placeholder */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar placeholder */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
          <span className="text-lg font-bold text-gray-800">🧪 无尽炼金</span>
        </div>

        {/* Workspace placeholder */}
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          工作台（Phase 3 实现）
        </div>
      </div>
    </div>
  )
}

export default App
