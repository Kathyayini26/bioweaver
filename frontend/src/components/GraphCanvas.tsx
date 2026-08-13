import { useState, useEffect, useRef } from 'react';
import type { SubgraphData } from '../types';
import { Button } from './ui/button';
import { RotateCcw, HelpCircle } from 'lucide-react';
import * as d3 from 'd3';

interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'gene' | 'disease' | 'pathway' | 'protein' | 'chemical' | string;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  source: string;
  target: string;
  predicate: string;
  score: number;
}

// Deterministic force-directed collision resolution to maintain minimum 120px node center distance
const resolveCollisions = (nodes: SimulationNode[], minDistance = 120) => {
  const n = nodes.length;
  for (let iter = 0; iter < 6; iter++) {
    let shifted = false;
    for (let i = 0; i < n; i++) {
      const nodeA = nodes[i];
      if (nodeA.x === undefined || nodeA.y === undefined) continue;

      for (let j = i + 1; j < n; j++) {
        const nodeB = nodes[j];
        if (nodeB.x === undefined || nodeB.y === undefined) continue;

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist < minDistance) {
          const overlap = minDistance - dist;
          const pushX = dist > 1 ? (dx / dist) * overlap : (Math.random() - 0.5) * overlap;
          const pushY = dist > 1 ? (dy / dist) * overlap : (Math.random() - 0.5) * overlap;

          const isACenter = nodeA.fx !== undefined;
          const isBCenter = nodeB.fx !== undefined;

          if (isACenter && !isBCenter) {
            nodeB.x += pushX;
            nodeB.y += pushY;
          } else if (isBCenter && !isACenter) {
            nodeA.x -= pushX;
            nodeA.y -= pushY;
          } else if (!isACenter && !isBCenter) {
            nodeA.x -= pushX * 0.5;
            nodeA.y -= pushY * 0.5;
            nodeB.x += pushX * 0.5;
            nodeB.y += pushY * 0.5;
          }
          shifted = true;
        }
      }
    }
    if (!shifted) break;
  }
};

// Dynamic label collision avoidance with offsets (alternates above/below)
const getLabelOffset = (node: SimulationNode, allNodes: SimulationNode[], isCenter: boolean) => {
  if (node.x === undefined || node.y === undefined) return { y: 20 };
  const defaultY = isCenter ? 25 : 20;

  let hasNearbyCollision = false;
  let alternate = false;

  for (const other of allNodes) {
    if (other.id === node.id || other.x === undefined || other.y === undefined) continue;

    const dx = Math.abs(node.x - other.x);
    const dy = Math.abs(node.y - other.y);

    // If nodes are close horizontally (< 110px) and close vertically (< 45px)
    if (dx < 110 && dy < 45) {
      hasNearbyCollision = true;
      if (node.id < other.id) {
        alternate = true;
      }
      break;
    }
  }

  if (hasNearbyCollision && alternate) {
    // Render label above node
    return { y: -16 };
  }
  return { y: defaultY };
};

interface GraphCanvasProps {
  subgraph: SubgraphData;
  centerNode: string | null;
  focusedNode: string | null;
  onNodeClick: (nodeLabel: string) => void;
  onNodeDoubleClick: (nodeLabel: string) => void;
  minScore: number;
  setMinScore: (score: number) => void;
}

export function GraphCanvas({ 
  subgraph, 
  centerNode,
  focusedNode,
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
  
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);
  const prevPositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  // Eased target references for requestAnimationFrame interpolation
  const targetZoomRef = useRef(1);
  const targetPanRef = useRef({ x: 0, y: 0 });
  const currentZoomRef = useRef(1);
  const currentPanRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });

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
      .force('collide', d3.forceCollide<SimulationNode>().radius(65).strength(0.8).iterations(3))
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
      // Deterministically resolve collisions to maintain 120px minimum spacing
      resolveCollisions(simNodes, 120);

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

  // Buttery-smooth LERP rendering loop at 60 FPS
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const ease = 0.15; // interpolation factor
      
      const nextZoom = currentZoomRef.current + (targetZoomRef.current - currentZoomRef.current) * ease;
      const nextPanX = currentPanRef.current.x + (targetPanRef.current.x - currentPanRef.current.x) * ease;
      const nextPanY = currentPanRef.current.y + (targetPanRef.current.y - currentPanRef.current.y) * ease;
      
      let changed = false;

      if (Math.abs(nextZoom - currentZoomRef.current) > 0.0005) {
        currentZoomRef.current = nextZoom;
        changed = true;
      } else {
        currentZoomRef.current = targetZoomRef.current;
      }

      if (Math.abs(nextPanX - currentPanRef.current.x) > 0.02 || Math.abs(nextPanY - currentPanRef.current.y) > 0.02) {
        currentPanRef.current = { x: nextPanX, y: nextPanY };
        changed = true;
      } else {
        currentPanRef.current = targetPanRef.current;
      }

      if (changed) {
        setZoom(currentZoomRef.current);
        setPan({ x: currentPanRef.current.x, y: currentPanRef.current.y });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Reset target scales when subgraph changes
  useEffect(() => {
    targetZoomRef.current = 1.0;
    targetPanRef.current = { x: 0, y: 0 };
    currentZoomRef.current = 1.0;
    currentPanRef.current = { x: 0, y: 0 };
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, [subgraph]);

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    const mx = 350;
    const my = 250;
    const currentTargetZoom = targetZoomRef.current;
    
    if (direction === 'in') {
      const newZ = Math.min(2.5, currentTargetZoom + 0.3);
      const ratio = newZ / currentTargetZoom;
      targetPanRef.current = {
        x: mx - (mx - targetPanRef.current.x) * ratio,
        y: my - (my - targetPanRef.current.y) * ratio
      };
      targetZoomRef.current = newZ;
    } else if (direction === 'out') {
      const newZ = Math.max(0.4, currentTargetZoom - 0.3);
      const ratio = newZ / currentTargetZoom;
      targetPanRef.current = {
        x: mx - (mx - targetPanRef.current.x) * ratio,
        y: my - (my - targetPanRef.current.y) * ratio
      };
      targetZoomRef.current = newZ;
    } else {
      targetZoomRef.current = 1.0;
      targetPanRef.current = { x: 0, y: 0 };
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Smoothly anchor zoom relative to mouse coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const zoomFactor = 0.08;
    const currentTargetZoom = targetZoomRef.current;
    
    let newZ = currentTargetZoom;
    if (e.deltaY < 0) {
      newZ = Math.min(2.5, currentTargetZoom + zoomFactor);
    } else {
      newZ = Math.max(0.4, currentTargetZoom - zoomFactor);
    }
    
    if (newZ !== currentTargetZoom) {
      const ratio = newZ / currentTargetZoom;
      targetPanRef.current = {
        x: mx - (mx - targetPanRef.current.x) * ratio,
        y: my - (my - targetPanRef.current.y) * ratio
      };
      targetZoomRef.current = newZ;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - targetPanRef.current.x,
      y: e.clientY - targetPanRef.current.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!isDragging) return;
    targetPanRef.current = {
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Center viewport smoothly on clicked node
  const handleNodeClick = (node: SimulationNode) => {
    onNodeClick(node.label);
    if (node.x !== undefined && node.y !== undefined) {
      const centerX = 350;
      const centerY = 250;
      const targetZoom = 1.35; // zoom in on node focus
      targetZoomRef.current = targetZoom;
      targetPanRef.current = {
        x: centerX - node.x * targetZoom,
        y: centerY - node.y * targetZoom
      };
    }
  };

  // Double click centers and walks to new neighborhood subgraph
  const handleNodeDoubleClick = (node: SimulationNode) => {
    if (node.x !== undefined && node.y !== undefined) {
      const centerX = 350;
      const centerY = 250;
      const targetZoom = 1.0; // reset zoom for center node
      targetZoomRef.current = targetZoom;
      targetPanRef.current = {
        x: centerX - node.x * targetZoom,
        y: centerY - node.y * targetZoom
      };
    }
    onNodeDoubleClick(node.label);
  };

  // Dynamic color selection per biological entity type
  const getNodeColor = (type: string) => {
    if (type === 'gene') return 'var(--graph-node-gene)';
    if (type === 'pathway') return 'var(--graph-node-pathway)';
    return 'var(--graph-node-disease)'; // default: Disease & others (Gray)
  };

  // Dynamic edge style per relationship predicate and target node type
  const getEdgeStyle = (predicate: string, targetType?: string) => {
    const cleanPred = predicate.toLowerCase().replace('biolink:', '');
    
    // 1. Biological Pathway Link (Purple dotted/dashed line)
    if (
      targetType === 'pathway' || 
      cleanPred === 'participates_in' || 
      cleanPred === 'participates-in' || 
      cleanPred === 'pathway_link'
    ) {
      return {
        strokeDasharray: '2,4',
        stroke: 'var(--graph-node-pathway)',
        strokeWidth: 1.8,
        opacity: 0.9
      };
    }
    
    // 2. Gene-Gene PPI Interaction (Teal dotted line)
    if (
      targetType === 'gene' || 
      cleanPred === 'interacts_with' || 
      cleanPred === 'interacts-with' || 
      cleanPred === 'protein-interaction' || 
      cleanPred === 'protein_interaction' || 
      cleanPred === 'ppi'
    ) {
      return {
        strokeDasharray: '4,4',
        stroke: 'var(--graph-node-gene)',
        strokeWidth: 1.5,
        opacity: 0.85
      };
    }
    
    // 3. Gene-Disease Causal / Association link (Solid line)
    if (
      targetType === 'disease' || 
      cleanPred === 'causes' || 
      cleanPred === 'associated_with' || 
      cleanPred === 'associated-with' || 
      cleanPred === 'associated_with_increased_likelihood_of'
    ) {
      return {
        strokeDasharray: 'none',
        stroke: 'var(--graph-node-disease)',
        strokeWidth: 2.0,
        opacity: 0.95
      };
    }

    // Default fallback
    return {
      strokeDasharray: 'none',
      stroke: 'var(--graph-edge)',
      strokeWidth: 1.2,
      opacity: 0.65
    };
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

  // Find all adjacent nodes to the focused node to highlight structural context
  const adjacentNodeIds = new Set<string>();
  if (focusedNode) {
    const fNode = nodes.find(n => n.label === focusedNode);
    if (fNode) {
      adjacentNodeIds.add(fNode.id);
      edges.forEach(edge => {
        const sId = getLinkId(edge.source);
        const tId = getLinkId(edge.target);
        if (sId === fNode.id) adjacentNodeIds.add(tId || '');
        if (tId === fNode.id) adjacentNodeIds.add(sId || '');
      });
    }
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

  // Filter out any nodes that do not have at least one visible connection under the current score threshold
  const visibleNodes = nodes.filter(node => {
    if (node.id === subgraph.center.id) return true;
    
    // Check if there is at least one active edge with score >= minScore connecting this node
    return edges.some(edge => {
      const sId = getLinkId(edge.source);
      const tId = getLinkId(edge.target);
      const isConnected = sId === node.id || tId === node.id;
      return isConnected && edge.score >= minScore;
    });
  });

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

        <div className="flex items-center gap-3">
          {/* Word/Document style Zoom controls: [-] ----o---- [+] 100% */}
          <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-3">
            <button 
              type="button"
              onClick={() => handleZoom('out')}
              className="w-5 h-5 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-905 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded select-none cursor-pointer leading-none"
              title="Zoom Out"
            >
              −
            </button>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.02"
              value={zoom}
              onChange={(e) => {
                const newZ = parseFloat(e.target.value);
                const mx = 350;
                const my = 250;
                const ratio = newZ / targetZoomRef.current;
                targetPanRef.current = {
                  x: mx - (mx - targetPanRef.current.x) * ratio,
                  y: my - (my - targetPanRef.current.y) * ratio
                };
                targetZoomRef.current = newZ;
              }}
              className="w-20 accent-teal-600 dark:accent-teal-400 cursor-pointer h-1"
              title="Zoom scale slider"
            />
            <button 
              type="button"
              onClick={() => handleZoom('in')}
              className="w-5 h-5 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-905 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded select-none cursor-pointer leading-none"
              title="Zoom In"
            >
              +
            </button>
            <span className="font-mono text-[10px] w-9 text-right text-slate-500 dark:text-slate-400 font-bold select-none">
              {Math.round(zoom * 100)}%
            </span>
          </div>

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
            <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.6" result="blur" />
              <feColorMatrix type="matrix" values="
                1  0  0  0  0
                0  1  0  0  0
                0  0  1  0  0
                0  0  0  2.2 0
              " />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotGrid)" pointerEvents="none" />

          {/* Pan and Zoom Layer - Easing managed in LERP physics loop */}
          <g
            transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
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
              const edgeStyle = getEdgeStyle(edge.predicate, targetNode.type);
              
              // Hide connections below the score threshold smoothly
              const isBelowThreshold = edge.score < minScore;
              if (isBelowThreshold) return null;

              // Check if edge lies on the active path between center gene and clicked disease node
              const isSignal = focusedNode && focusedNode !== centerNode && (
                (sourceNode.label === centerNode && targetNode.label === focusedNode) ||
                (targetNode.label === centerNode && sourceNode.label === focusedNode)
              );

              const pathId = `flow-path-${idx}`;
              const isSourceCenter = sourceNode.label === centerNode;

              // Compute smooth curved Bézier coordinates
              const sx = sourceNode.x ?? 0;
              const sy = sourceNode.y ?? 0;
              const tx = targetNode.x ?? 0;
              const ty = targetNode.y ?? 0;

              const dx = tx - sx;
              const dy = ty - sy;
              const mx = (sx + tx) / 2;
              const my = (sy + ty) / 2;
              const curveStrength = 32; // curvature offset height
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const px = -dy / len;
              const py = dx / len;
              const cx = mx + px * curveStrength;
              const cy = my + py * curveStrength;

              const pathD = isSourceCenter 
                ? `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}` 
                : `M ${tx} ${ty} Q ${cx} ${cy} ${sx} ${sy}`;

              return (
                <g key={idx}>
                  {isSignal ? (
                    <path 
                      id={pathId}
                      d={pathD}
                      fill="none"
                      stroke="var(--graph-node-gene)"
                      strokeWidth={2.4}
                      strokeOpacity={0.8}
                      className="svg-edge transition-all duration-300"
                    />
                  ) : (
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={isHighlighted ? 'var(--graph-edge-highlight)' : edgeStyle.stroke}
                      strokeWidth={isHighlighted ? 2.5 : edgeStyle.strokeWidth}
                      strokeDasharray={isHighlighted ? undefined : edgeStyle.strokeDasharray}
                      strokeOpacity={isHighlighted ? 0.95 : (hoveredNode ? 0.05 : edgeStyle.opacity)}
                      className="svg-edge transition-all duration-300"
                    />
                  )}
                  {isSignal && [0, 1, 2, 3].map((pIdx) => {
                    const delay = pIdx * 0.9;
                    const duration = 3.6;
                    return (
                      <circle 
                        key={pIdx} 
                        r="2.0" 
                        fill="var(--graph-node-gene)" 
                        filter="url(#glow-soft)"
                        style={{ pointerEvents: 'none' }}
                      >
                        <animateMotion
                          dur={`${duration}s`}
                          repeatCount="indefinite"
                          begin={`${delay}s`}
                          calcMode="spline"
                          keyTimes="0;1"
                          keySplines="0.42 0 0.58 1"
                        >
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                        <animate
                          attributeName="opacity"
                          values="0;0.95;0.95;0"
                          keyTimes="0;0.15;0.85;1"
                          dur={`${duration}s`}
                          repeatCount="indefinite"
                          begin={`${delay}s`}
                        />
                      </circle>
                    );
                  })}
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
            {visibleNodes.map(node => {
              const isCenter = node.id === subgraph.center.id;
              const isHovered = hoveredNode === node.id;
              const active = isNodeActive(node);
              const labelOffset = getLabelOffset(node, visibleNodes, isCenter);

              // Smooth transition fade-out/fade-in based on threshold slider active status
              const hasFocusHighlight = focusedNode && focusedNode !== centerNode;
              const isAdjacentToFocus = focusedNode ? (
                node.label === focusedNode || adjacentNodeIds.has(node.id)
              ) : false;

              const baseOpacity = active 
                ? (hoveredNode 
                    ? (connectedNodeIds.has(node.id) ? 1.0 : 0.15) 
                    : (hasFocusHighlight 
                        ? (isAdjacentToFocus ? 1.0 : 0.35) 
                        : 1.0
                      )
                  ) 
                : 0.0;
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
                      fill={getNodeColor(node.type)}
                      className="selected-glow"
                      pointerEvents="none"
                    />
                  )}

                  {/* Selected node animated pulse ring */}
                  {node.label === focusedNode && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={15}
                      fill="none"
                      stroke={getNodeColor(node.type)}
                      strokeWidth="2"
                      className="selected-disease-glow"
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
                      stroke={getNodeColor(node.type)}
                      strokeWidth="1.5"
                      className="animate-ping"
                      opacity="0.5"
                    />
                  )}

                  {/* Core Node Circle - gently enlarged on hover */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isCenter ? (isHovered ? 15 : 12) : (node.label === focusedNode ? 12 : (isHovered ? 12 : 9))}
                    fill={getNodeColor(node.type)}
                    stroke={isCenter ? '#ffffff' : (node.label === focusedNode ? getNodeColor(node.type) : (isHovered ? 'var(--graph-label)' : 'transparent'))}
                    strokeWidth={isCenter ? 2.5 : 1.5}
                    className={`shadow-sm svg-node ${isAdjacentToFocus && !isCenter ? 'node-ambient-glow' : ''}`}
                  />

                  {/* Label Text */}
                  <text
                    x={node.x}
                    y={(node.y ?? 0) + labelOffset.y}
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
      <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded text-[10px] text-slate-500 font-medium space-y-1.5 z-10 transition-colors duration-400">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-700 dark:text-slate-300">Graph Legend:</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--graph-node-gene)' }} />
            <span>Gene</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--graph-node-disease)' }} />
            <span>Disease</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--graph-node-pathway)' }} />
            <span>Pathway</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-0.5 bg-slate-400 dark:bg-slate-650" />
            <span>Association</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-0.5 border-b border-dashed border-teal-500" />
            <span>PPI (Gene-Gene)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-0.5 border-b border-dotted border-purple-500" />
            <span>Pathway Link</span>
          </div>
        </div>
      </div>
    </div>
  );
}
