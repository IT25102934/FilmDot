import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch } from 'lucide-react';

// Default demo nodes for an empty shot flow
const defaultNodes = [
  {
    id: 'scene-1',
    type: 'default',
    position: { x: 100, y: 100 },
    data: { label: '🎬 Scene 1: Opening' },
    style: {
      background: '#1e293b',
      color: '#e2e8f0',
      border: '1px solid #6366f1',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '13px',
    },
  },
  {
    id: 'shot-1a',
    type: 'default',
    position: { x: 50, y: 250 },
    data: { label: '📷 Wide Shot' },
    style: {
      background: '#1e293b',
      color: '#e2e8f0',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
    },
  },
  {
    id: 'shot-1b',
    type: 'default',
    position: { x: 300, y: 250 },
    data: { label: '📷 Close-up' },
    style: {
      background: '#1e293b',
      color: '#e2e8f0',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
    },
  },
  {
    id: 'scene-2',
    type: 'default',
    position: { x: 400, y: 100 },
    data: { label: '🎬 Scene 2: Dialogue' },
    style: {
      background: '#1e293b',
      color: '#e2e8f0',
      border: '1px solid #6366f1',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '13px',
    },
  },
];

const defaultEdges = [
  { id: 'e1', source: 'scene-1', target: 'shot-1a', animated: true, style: { stroke: '#6366f1' } },
  { id: 'e2', source: 'scene-1', target: 'shot-1b', animated: true, style: { stroke: '#6366f1' } },
  { id: 'e3', source: 'shot-1b', target: 'scene-2', style: { stroke: '#334155' } },
];

export default function ShotFlowView() {
  const [nodes, , onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: '#6366f1' } }, eds)
      ),
    [setEdges]
  );

  const minimapStyle = useMemo(
    () => ({
      nodeColor: '#6366f1',
      maskColor: 'rgba(2, 6, 23, 0.8)',
    }),
    []
  );

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-cinema-border bg-cinema-surface">
        <GitBranch className="w-4 h-4 text-accent" />
        <span className="text-sm text-cinema-heading font-medium">Shot Flow Editor</span>
        <span className="text-xs text-cinema-muted">
          {nodes.length} nodes &middot; {edges.length} connections
        </span>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#334155" gap={20} size={1} />
          <Controls />
          <MiniMap style={minimapStyle} zoomable pannable />
        </ReactFlow>
      </div>
    </div>
  );
}
