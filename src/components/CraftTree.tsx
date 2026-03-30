import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useElementStore } from '../store/elementStore'
import { useRecipeStore } from '../store/recipeStore'
import type { CraftTreeNodeData } from '../types'
import { buildTreeData } from '../utils/helpers'

type CraftTreeDisplayData = CraftTreeNodeData & {
  isHighlighted: boolean
  isSelected: boolean
}

function getMiniMapNodeColor(node: Node<CraftTreeDisplayData>) {
  if (node.data.isSelected) return '#2563eb'
  if (node.data.isHighlighted) return '#f59e0b'
  if (node.data.isBase) return '#dbeafe'
  return '#e5e7eb'
}

function getMiniMapNodeStroke(node: Node<CraftTreeDisplayData>) {
  if (node.data.isSelected) return '#1d4ed8'
  if (node.data.isHighlighted) return '#d97706'
  if (node.data.isBase) return '#60a5fa'
  return '#94a3b8'
}

interface CraftTreeProps {
  open: boolean
  onClose: () => void
}

const nodeTypes: NodeTypes = {
  craftElement: CraftTreeNode,
}

export default function CraftTree({ open, onClose }: CraftTreeProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/40 p-2 sm:p-4" onClick={onClose}>
      <div
        className="mx-auto flex h-full w-full max-w-7xl flex-col rounded-2xl border border-gray-200 bg-white shadow-xl"
        onClick={event => event.stopPropagation()}
      >
        <ReactFlowProvider>
          <CraftTreeContent onClose={onClose} />
        </ReactFlowProvider>
      </div>
    </div>
  )
}

function CraftTreeContent({ onClose }: { onClose: () => void }) {
  const elementMap = useElementStore(s => s.elements)
  const recipes = useRecipeStore(s => s.recipes)
  const elements = useMemo(() => Object.values(elementMap), [elementMap])
  const { fitView, setCenter } = useReactFlow()

  const [search, setSearch] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const { nodes, edges } = useMemo(() => buildTreeData(elements, recipes), [elements, recipes])

  const searchedNode = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return null

    return nodes.find(node => node.data.name.toLowerCase().includes(query)) ?? null
  }, [nodes, search])

  useEffect(() => {
    if (!nodes.length) return
    queueMicrotask(() => fitView({ padding: 0.15, duration: 200 }))
  }, [nodes, fitView])

  useEffect(() => {
    if (!searchedNode) return

    setSelectedNodeId(searchedNode.id)
    queueMicrotask(() => {
      setCenter(
        searchedNode.position.x + 72,
        searchedNode.position.y + 30,
        { zoom: 1.1, duration: 300 },
      )
    })
  }, [searchedNode, setCenter])

  const highlightedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>()

    const related = new Set<string>([selectedNodeId])
    for (const edge of edges) {
      if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
        related.add(edge.source)
        related.add(edge.target)
      }
    }

    return related
  }, [selectedNodeId, edges])

  const highlightedEdgeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>()

    return new Set(
      edges
        .filter(edge => edge.source === selectedNodeId || edge.target === selectedNodeId)
        .map(edge => edge.id),
    )
  }, [selectedNodeId, edges])

  const displayNodes = useMemo<Node<CraftTreeDisplayData>[]>(() => {
    return nodes.map(node => ({
      ...node,
      type: 'craftElement',
      data: {
        ...node.data,
        isHighlighted: highlightedNodeIds.has(node.id),
        isSelected: selectedNodeId === node.id,
      },
    }))
  }, [nodes, highlightedNodeIds, selectedNodeId])

  const displayEdges = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      animated: highlightedEdgeIds.has(edge.id),
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: highlightedEdgeIds.has(edge.id)
          ? '#2563eb'
          : edge.data?.isPrimary
            ? '#64748b'
            : '#cbd5e1',
      },
      style: highlightedEdgeIds.has(edge.id)
        ? { stroke: '#2563eb', strokeWidth: 2.5 }
        : edge.data?.isPrimary
          ? { stroke: '#64748b', strokeWidth: 1.6 }
          : { stroke: '#cbd5e1', strokeWidth: 1.1, strokeDasharray: '5 4', opacity: 0.7 },
    })) as Edge[]
  }, [edges, highlightedEdgeIds])

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">合成树</h2>
          <p className="mt-1 text-sm text-gray-500">查看元素之间的合成关系，并搜索定位到指定节点。</p>
          <p className="mt-1 text-xs text-gray-400">当前按最短合成深度分层，主路径为实线，替代路线为虚线。</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          关闭
        </button>
      </div>

      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <input
          type="text"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="搜索元素名称..."
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none sm:max-w-sm"
        />
        <button
          type="button"
          onClick={() => {
            setSearch('')
            setSelectedNodeId(null)
            void fitView({ padding: 0.15, duration: 250 })
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          重置视图
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {displayNodes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            暂无可展示的合成关系
          </div>
        ) : (
          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={1.8}
            onNodeClick={(_event, node) => setSelectedNodeId(node.id)}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} size={1} />
            <MiniMap
              zoomable
              pannable
              bgColor="#f8fafc"
              maskColor="rgb(148 163 184 / 0.18)"
              nodeColor={getMiniMapNodeColor}
              nodeStrokeColor={getMiniMapNodeStroke}
              nodeBorderRadius={10}
              className="!border !border-gray-200 !bg-slate-50 !shadow-sm"
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}
      </div>
    </>
  )
}

function CraftTreeNode({
  data,
}: {
  data: Record<string, unknown>
}) {
  const nodeData = data as CraftTreeDisplayData

  return (
    <div
      title={`${nodeData.name} · ${nodeData.categories.join('、') || '未分类'}`}
      className={`min-w-[132px] rounded-xl border bg-white px-4 py-2 shadow-sm transition-all ${
        nodeData.isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
          : nodeData.isHighlighted
            ? 'border-amber-300 bg-amber-50 shadow-md'
            : 'border-gray-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
      />
      <div className="flex items-center gap-2">
        <span className="text-xl">{nodeData.emoji}</span>
        <div className="min-w-0">
          <div className="truncate font-medium text-gray-800">{nodeData.name}</div>
          <div className="truncate text-xs text-gray-500">
            {nodeData.isBase ? '基础元素' : nodeData.categories.join('、') || '未分类'}
          </div>
          <div className="mt-1 text-[11px] text-gray-400">
            深度 {nodeData.depth}
            {nodeData.sourceCount > 0 ? ` · 来源 ${nodeData.sourceCount} 条` : ''}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
      />
    </div>
  )
}
