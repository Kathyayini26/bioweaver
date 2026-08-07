import { useState, useEffect, useRef } from 'react';
import type { SubgraphData } from '../types';
import { Button } from './ui/button';
import { ZoomIn, ZoomOut, RotateCcw, HelpCircle } from 'lucide-react';
import * as d3 from 'd3';

interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'gene' | 'disease';
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  source: string | SimulationNode;
  target: string | SimulationNode;
  predicate: string;
  score: number;
}

interface GraphCanvasProps {
  subgraph: SubgraphData;
  onNodeClick: (nodeLabel: string) => void;
  onNodeDoubleClick: (nodeLabel: string) => void;
  minScore: number;
  setMinScore: (score: number) => void;
}

export function GraphCanvas({ 
  subgraph, 
  onNodeClick, 
  onNodeDoubleClick, 
  minScore, 
  setMinScore 
}: GraphCanvasProps) {
  const [nodes, setNodes] = useState<SimulationNode[]>([]);
  const [edges, setEdges] = useState<SimulationLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);
  const prevPositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  // Safe type-guard extraction of D3 link node IDs
  const getLinkId = (node: string | SimulationNode): string => {
    if (typeof node === 'object' && node !== null) {
      return node.id;
    }
    return node;
  };

  // Setup D3 Force Simulation with alpha decay (settles naturally)
  useEffect(() => {
    const centerId = subgraph.center.id;
    const canvasWidth = 700;
    const canvasHeight = 500;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const prevPositions = prevPositionsRef.current;
    const parentX = prevPositions[centerId]?.x ?? centerX;
    const parentY = prevPositions[centerId]?.y ?? centerY;

    // Map subgraph nodes, preserving existing coordinates to prevent jumping
    const simNodes: SimulationNode[] = subgraph.nodes.map((node, idx) => {
      const isCenter = node.id === centerId;
      if (prevPositions[node.id]) {
        return {
          id: node.id,
          label: node.label,
          type: node.type,
          x: prevPositions[node.id].x,
          y: prevPositions[node.id].y,
          vx: 0,
          vy: 0
        };
      }

      // Spawning new neighbors radiating from parent's location
      const angle = (idx / (subgraph.nodes.length || 1)) * 2 * Math.PI + (Math.random() - 0.5) * 0.3;
      const radius = isCenter ? 0 : 80 + Math.random() * 30;

      return {
        id: node.id,
        label: node.label,
        type: node.type,
        x: isCenter ? centerX : parentX + Math.cos(angle) * radius,
        y: isCenter ? centerY : parentY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };
    });

    // Map edges to D3 links
    const simEdges: SimulationLink[] = subgraph.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      predicate: edge.predicate,
      score: edge.score
    }));

    // Initialize D3 Simulation
    const sim = d3.forceSimulation<SimulationNode, SimulationLink>(simNodes)
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(simEdges)
        .id(d => d.id)
        .distance((_, idx) => 110 + (idx % 3) * 15) // asymmetric biological link lengths
        .strength(0.04)
      )
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(centerX, centerY))
      .force('x', d3.forceX(centerX).strength(0.015))
      .force('y', d3.forceY(centerY).strength(0.015));

    // Lock center node at the middle anchor
    const centerNode = simNodes.find(n => n.id === centerId);
    if (centerNode) {
      centerNode.fx = centerX;
      centerNode.fy = centerY;
    }

    simulationRef.current = sim;

    sim.on('tick', () => {
      simNodes.forEach(node => {
        if (node.x !== undefined && node.y !== undefined) {
          prevPositions[node.id] = { x: node.x, y: node.y };
        }
      });
      setNodes([...simNodes]);
      setEdges([...simEdges]);
    });

    return () => {
      sim.stop();
    };
  }, [subgraph]);

  // Reheat force layout briefly when threshold score changes to let nodes resettle
  useEffect(() => {
    if (simulationRef.current) {
      simulationRef.current.alpha(0.25).restart();
    }
  }, [minScore]);

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (direction === 'in') setZoom(z => Math.min(2.5, z + 0.2));
    else if (direction === 'out') setZoom(z => Math.max(0.4, z - 0.2));
    else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(z => Math.min(2.5, z + 0.06));
    } else {
      setZoom(z => Math.max(0.4, z - 0.06));
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Center viewport on selected node smoothly on click
  const handleNodeClick = (node: SimulationNode) => {
    onNodeClick(node.label);
    if (node.x !== undefined && node.y !== undefined) {
      const centerX = 350;
      const centerY = 250;
      setPan({
        x: centerX - node.x,
        y: centerY - node.y
      });
    }
  };

  // Double click centers and loads new neighborhood subgraph
  const handleNodeDoubleClick = (node: SimulationNode) => {
    if (node.x !== undefined && node.y !== undefined) {
      const centerX = 350;
      const centerY = 250;
      setPan({
        x: centerX - node.x,
        y: centerY - node.y
      });
    }
    onNodeDoubleClick(node.label);
  };

  // Hover highlights
  const connectedNodeIds = new Set<string>();
  if (hoveredNode) {
    connectedNodeIds.add(hoveredNode);
    edges.forEach(edge => {
      const sId = getLinkId(edge.source);
      const tId = getLinkId(edge.target);
      if (sId === hoveredNode) connectedNodeIds.add(tId || '');
      if (tId === hoveredNode) connectedNodeIds.add(sId || '');
    });
  }

  // Active status checker based on score slider
  const isNodeActive = (node: SimulationNode): boolean => {
    const centerId = subgraph.center.id;
    if (node.id === centerId) return true;

    // Check if there is an edge connecting this node to the center with score >= minScore
    return edges.some(edge => {
      const sId = getLinkId(edge.source);
      const tId = getLinkId(edge.target);
      const hasCenter = sId === centerId || tId === centerId;
      const hasNode = sId === node.id || tId === node.id;
      return hasCenter && hasNode && edge.score >= minScore;
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded overflow-hidden relative transition-all duration-300">
      {/* Top Toolbar */}
      <div className="h-10 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex items-center justify-between px-4 z-10 shrink-0 transition-colors duration-400">
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="font-mono text-[10px] tracking-wider uppercase">LOCAL NETWORK VIEW</span>
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
            <span className="text-[10px] uppercase font-bold text-slate-400">Threshold:</span>
            <span className="font-mono text-teal-650 dark:text-teal-400 font-bold">{minScore.toFixed(2)}</span>
            <input
              type="range"
              min="0.70"
              max="0.99"
              step="0.01"
              value={minScore}
              onChange={(e) => setMinScore(parseFloat(e.target.value))}
              className="w-24 accent-teal-600 dark:accent-teal-400 cursor-pointer h-1"
              title="Slide to filter neighbors by minimum association score"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 cursor-pointer" 
            onClick={() => handleZoom('in')}
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 cursor-pointer" 
            onClick={() => handleZoom('out')}
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 cursor-pointer" 
            onClick={() => handleZoom('reset')}
            title="Reset Viewport Position & Scale"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div 
        className="flex-1 overflow-hidden relative"
        onWheel={handleWheel}
      >
        <svg
          viewBox="0 0 700 500"
          className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Scientific Dot Grid Background */}
          <defs>
            <pattern id="dotGrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="var(--grid-dot)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotGrid)" pointerEvents="none" />

          {/* Pan and Zoom Layer - Easing transition */}
          <g
            transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
            style={{ transition: isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.1, 0.9, 0.2, 1)' }}
          >
            {/* Draw Links */}
            {edges.map((edge, idx) => {
              const sId = getLinkId(edge.source);
              const tId = getLinkId(edge.target);

              const sourceNode = nodes.find(n => n.id === sId);
              const targetNode = nodes.find(n => n.id === tId);
              if (!sourceNode || !targetNode) return null;

              const isHighlighted = hoveredNode 
                ? sId === hoveredNode || tId === hoveredNode
                : false;
              const isDashed = edge.predicate === 'protein-interaction';

              // Hide connections below the score threshold smoothly
              const isBelowThreshold = edge.score < minScore;
              if (isBelowThreshold) return null;

              const opacity = hoveredNode 
                ? isHighlighted ? 0.95 : 0.05 
                : 0.35;

              return (
                <g key={idx}>
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={isHighlighted ? 'var(--graph-edge-highlight)' : 'var(--graph-edge)'}
                    strokeWidth={isHighlighted ? 2.5 : 1.2}
                    strokeDasharray={isDashed ? '4,4' : undefined}
                    strokeOpacity={opacity}
                    className="svg-edge transition-all duration-300"
                  />
                  {isHighlighted && (
                    <text
                      x={((sourceNode.x ?? 0) + (targetNode.x ?? 0)) / 2}
                      y={((sourceNode.y ?? 0) + (targetNode.y ?? 0)) / 2 - 4}
                      fill="var(--graph-node-gene)"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="bg-slate-900 px-1 py-0.5 rounded shadow-sm font-mono select-none pointer-events-none"
                    >
                      {edge.predicate.replace('biolink:', '')} ({edge.score.toFixed(2)})
                    </text>
                  )}
                </g>
              );
            })}

            {/* Draw Nodes */}
            {nodes.map(node => {
              const isCenter = node.id === subgraph.center.id;
              const isHovered = hoveredNode === node.id;
              const active = isNodeActive(node);

              // Smooth transition fade-out/fade-in based on threshold slider active status
              const baseOpacity = active ? (hoveredNode ? (connectedNodeIds.has(node.id) ? 1.0 : 0.2) : 1.0) : 0.0;
              const pointerEvents = active ? 'auto' : 'none';

              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(node)}
                  onDoubleClick={() => handleNodeDoubleClick(node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ 
                    opacity: baseOpacity, 
                    pointerEvents,
                    transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }}
                >
                  <title>{`Node: ${node.label} (${node.type}) - Double-click to re-center`}</title>

                  {/* Pulsating animated glow for selected node */}
                  {isCenter && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={12}
                      fill={node.type === 'gene' ? 'var(--graph-node-gene)' : 'var(--graph-node-disease)'}
                      className="selected-glow"
                      pointerEvents="none"
                    />
                  )}

                  {/* Outer circle rings for hover */}
                  {isHovered && !isCenter && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={14}
                      fill="none"
                      stroke={node.type === 'gene' ? 'var(--graph-node-gene)' : 'var(--graph-node-disease)'}
                      strokeWidth="1.5"
                      className="animate-ping"
                      opacity="0.5"
                    />
                  )}

                  {/* Core Node Circle - gently enlarged on hover */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isCenter ? (isHovered ? 15 : 12) : (isHovered ? 12 : 9)}
                    fill={node.type === 'gene' ? 'var(--graph-node-gene)' : 'var(--graph-node-disease)'}
                    stroke={isCenter ? '#ffffff' : (isHovered ? 'var(--graph-label)' : 'transparent')}
                    strokeWidth={isCenter ? 2.5 : 1.5}
                    className="shadow-sm svg-node"
                  />

                  {/* Label Text */}
                  <text
                    x={node.x}
                    y={(node.y ?? 0) + (isCenter ? (isHovered ? 28 : 25) : (isHovered ? 23 : 20))}
                    textAnchor="middle"
                    fontSize={isCenter ? '10' : '9'}
                    fontWeight={isCenter || isHovered ? 'bold' : '600'}
                    fill="var(--graph-label)"
                    className="font-mono tracking-tight select-none transition-all duration-200"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Guide Hints Overlay */}
      <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded text-[10px] text-slate-500 font-medium space-y-1 z-10 transition-colors duration-400">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-teal-600" />
          <span className="font-bold text-slate-700 dark:text-slate-355">Workspace Gestures:</span>
        </div>
        <div>• Click node to inspect & center view</div>
        <div>• Double-click node to query neighborhood</div>
        <div>• Scroll mousewheel to zoom viewport</div>
        <div>• Drag background to pan viewport</div>
      </div>

      {/* Graph Legend Overlay */}
      <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded text-[10px] text-slate-500 font-medium space-y-1 z-10 transition-colors duration-400">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700 dark:text-slate-330">Graph Legend:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'var(--graph-node-gene)' }} />
          <span>Gene Entity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'var(--graph-node-disease)' }} />
          <span>Disease Entity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5" style={{ backgroundColor: 'var(--graph-edge)' }} />
          <span>Association Link</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-b border-dashed" style={{ borderColor: 'var(--graph-edge)' }} />
          <span>Protein Interaction (PPI)</span>
        </div>
      </div>
    </div>
  );
}
