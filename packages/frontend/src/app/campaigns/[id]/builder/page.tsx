'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  Node, Edge, useNodesState, useEdgesState,
  addEdge, Connection, NodeTypes,
  NodeProps, Handle, Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom event node components
function ActionNode({ data }: NodeProps) {
  return (
    <div className="rounded-lg border-2 border-blue-500 bg-blue-500/10 px-4 py-3 min-w-[180px]">
      <Handle type="target" position={Position.Top} />
      <div className="text-xs text-blue-400 font-semibold uppercase tracking-wide">Action</div>
      <div className="text-sm font-medium mt-1">{data.label}</div>
      {data.description && <div className="text-xs text-muted-foreground mt-1">{data.description}</div>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function DecisionNode({ data }: NodeProps) {
  return (
    <div className="rounded-lg border-2 border-amber-500 bg-amber-500/10 px-4 py-3 min-w-[180px]">
      <Handle type="target" position={Position.Top} />
      <div className="text-xs text-amber-400 font-semibold uppercase tracking-wide">Decision</div>
      <div className="text-sm font-medium mt-1">{data.label}</div>
      {data.description && <div className="text-xs text-muted-foreground mt-1">{data.description}</div>}
      <Handle type="source" position={Position.Bottom} id="yes" style={{ left: '30%', background: '#22c55e' }} />
      <Handle type="source" position={Position.Bottom} id="no" style={{ left: '70%', background: '#ef4444' }} />
    </div>
  );
}

function ConditionNode({ data }: NodeProps) {
  return (
    <div className="rounded-lg border-2 border-purple-500 bg-purple-500/10 px-4 py-3 min-w-[180px]">
      <Handle type="target" position={Position.Top} />
      <div className="text-xs text-purple-400 font-semibold uppercase tracking-wide">Condition</div>
      <div className="text-sm font-medium mt-1">{data.label}</div>
      {data.description && <div className="text-xs text-muted-foreground mt-1">{data.description}</div>}
      <Handle type="source" position={Position.Bottom} id="yes" style={{ left: '30%', background: '#22c55e' }} />
      <Handle type="source" position={Position.Bottom} id="no" style={{ left: '70%', background: '#ef4444' }} />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  action: ActionNode,
  decision: DecisionNode,
  condition: ConditionNode,
};

const EVENT_TYPES = [
  { group: 'Actions', items: [
    { value: 'email.send', label: 'Send Email', type: 'action' },
    { value: 'stage.change', label: 'Change Stage', type: 'action' },
    { value: 'point.change', label: 'Adjust Points', type: 'action' },
    { value: 'tag.add', label: 'Add Tag', type: 'action' },
    { value: 'tag.remove', label: 'Remove Tag', type: 'action' },
    { value: 'notification.send', label: 'Send Notification', type: 'action' },
    { value: 'sms.send', label: 'Send SMS', type: 'action' },
    { value: 'lead.update', label: 'Update Contact', type: 'action' },
  ]},
  { group: 'Decisions', items: [
    { value: 'email.open', label: 'Email Opened?', type: 'decision' },
    { value: 'email.click', label: 'Email Clicked?', type: 'decision' },
    { value: 'form.submit', label: 'Form Submitted?', type: 'decision' },
    { value: 'page.hit', label: 'Page Viewed?', type: 'decision' },
    { value: 'asset.download', label: 'Asset Downloaded?', type: 'decision' },
  ]},
  { group: 'Conditions', items: [
    { value: 'field.value', label: 'Field Value', type: 'condition' },
    { value: 'segment.membership', label: 'In Segment', type: 'condition' },
    { value: 'point.score', label: 'Point Score', type: 'condition' },
  ]},
];

export default function CampaignBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const [campaignName, setCampaignName] = useState('New Campaign');
  const [showPalette, setShowPalette] = useState(true);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const campaignIdRef = useRef<string>('');

  useEffect(() => { params.then(p => { campaignIdRef.current = p.id; }); }, [params]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: '#666' } }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    const eventType = event.dataTransfer.getData('application/eventtype');
    const eventLabel = event.dataTransfer.getData('application/eventlabel');
    if (!type || !eventType) return;

    const position = reactFlowWrapper.current
      ? { x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left - 100, y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top - 30 }
      : { x: 100, y: 100 };

    const newNode: Node = {
      id: crypto.randomUUID(),
      type,
      position,
      data: { label: eventLabel, eventType, description: '' },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onDragStart = (event: React.DragEvent, nodeType: string, eventType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/eventtype', eventType);
    event.dataTransfer.setData('application/eventlabel', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Event Palette */}
      {showPalette && (
        <div className="w-72 border-r bg-card p-4 overflow-y-auto space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Event Palette</h2>
            <button onClick={() => setShowPalette(false)} className="text-xs text-muted-foreground">&times;</button>
          </div>
          {EVENT_TYPES.map(group => (
            <div key={group.group}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{group.group}</h3>
              <div className="space-y-1">
                {group.items.map(item => (
                  <div
                    key={item.value}
                    draggable
                    onDragStart={(e) => onDragStart(e, item.type, item.value, item.label)}
                    className={`cursor-grab rounded-md px-3 py-2 text-sm border text-center
                      ${item.type === 'action' ? 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-300' : ''}
                      ${item.type === 'decision' ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300' : ''}
                      ${item.type === 'condition' ? 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300' : ''}
                    `}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#333" gap={20} />
          <Controls />
          <MiniMap
            nodeStrokeColor="#666"
            nodeColor="#1a1a2e"
            maskColor="rgba(0,0,0,0.7)"
          />
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="w-80 border-l bg-card p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">Event Properties</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedNode.data.label as string}
                onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                value={selectedNode.data.description as string}
                onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, description: e.target.value } } : n))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
              <div className="text-sm text-muted-foreground">{selectedNode.type}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Event Type</label>
              <div className="text-sm text-muted-foreground">{selectedNode.data.eventType as string}</div>
            </div>
            <button
              className="w-full rounded-md bg-red-500/20 text-red-400 px-3 py-2 text-sm hover:bg-red-500/30"
              onClick={() => { setNodes(nds => nds.filter(n => n.id !== selectedNode.id)); setSelectedNode(null); }}
            >
              Delete Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
