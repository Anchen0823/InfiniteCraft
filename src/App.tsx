import { useElementStore } from './store/elementStore'
import { useSettingsStore } from './store/settingsStore'

function App() {
  const elements = useElementStore(s => s.getAllElements)()
  const craftCount = useSettingsStore(s => s.craftCount)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold text-gray-800">🧪 无尽炼金</h1>
      <p className="text-gray-500">已发现 {elements.length} 种元素 | 合成次数: {craftCount}</p>
      <div className="flex gap-3 flex-wrap justify-center">
        {elements.map(el => (
          <div
            key={el.id}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <span className="text-xl">{el.emoji}</span>
            <span className="text-sm font-medium text-gray-700">{el.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
