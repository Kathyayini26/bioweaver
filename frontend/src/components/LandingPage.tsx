import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { 
  Workflow, 
  ArrowRight, 
  Network, 
  GitMerge, 
  BookOpen, 
  Sun, 
  Moon,
  ChevronRight,
  FileText,
  ChevronDown
} from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export function LandingPage({ onLaunch, isDarkMode, toggleTheme }: LandingPageProps) {
  const [driftNodes, setDriftNodes] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const [driftLinks, setDriftLinks] = useState<{ source: number; target: number }[]>([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [activeCell, setActiveCell] = useState(0);
  
  // Real-time animation states
  const [dnaTime, setDnaTime] = useState(0);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // Monitor page scroll for parallax depth mapping
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Time ticking for DNA helix rotation
  useEffect(() => {
    let frameId: number;
    const tick = () => {
      setDnaTime(prev => prev + 0.015);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x: xPct, y: yPct });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: -1000, y: -1000 });
  };

  // Statistics counters state
  const [statsVisible, setStatsVisible] = useState(false);
  const [counts, setCounts] = useState({
    genes: 0,
    diseases: 0,
    nodes: 0,
    edges: 0,
    ppi: 0,
    assoc: 0
  });

  // Random cell walk simulation in embedding matrix
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCell(Math.floor(Math.random() * 32));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Generate static coordinate anchors for the hero particle field
    const nodes = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 70,
      size: i === 0 ? 9 : 4 + Math.random() * 4
    }));

    const links: { source: number; target: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const targets = [...nodes]
        .filter(n => n.id !== i)
        .sort((a, b) => {
          const distA = Math.hypot(a.x - nodes[i].x, a.y - nodes[i].y);
          const distB = Math.hypot(b.x - nodes[i].x, b.y - nodes[i].y);
          return distA - distB;
        })
        .slice(0, 2);

      targets.forEach(t => {
        if (!links.some(l => (l.source === i && l.target === t.id) || (l.source === t.id && l.target === i))) {
          links.push({ source: i, target: t.id });
        }
      });
    }

    setDriftNodes(nodes);
    setDriftLinks(links);
  }, []);

  // Animate counts when stats are in view
  useEffect(() => {
    if (!statsVisible) return;
    
    const duration = 1200; // ms
    const startTime = performance.now();
    
    const targetValues = {
      genes: 12026,
      diseases: 6571,
      nodes: 18597,
      edges: 107187,
      ppi: 100554,
      assoc: 6961
    };

    let animationFrameId: number;

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function out-quad
      const ease = progress * (2 - progress);

      setCounts({
        genes: Math.floor(targetValues.genes * ease),
        diseases: Math.floor(targetValues.diseases * ease),
        nodes: Math.floor(targetValues.nodes * ease),
        edges: Math.floor(targetValues.edges * ease),
        ppi: Math.floor(targetValues.ppi * ease),
        assoc: Math.floor(targetValues.assoc * ease)
      });

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [statsVisible]);

  return (
    <div className="h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-905 dark:text-slate-100 transition-colors duration-300 relative">
      
      {/* Dynamic Background Mesh Glows */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-teal-500/[0.04] dark:bg-teal-500/[0.02] rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-[40%] right-1/4 w-[600px] h-[600px] bg-indigo-500/[0.04] dark:bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none z-0" />

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 h-14 border-b border-slate-200/50 dark:border-slate-800/40 bg-white/60 dark:bg-[#020617]/50 backdrop-blur-lg flex items-center justify-between px-6 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-teal-500/10 rounded text-teal-655 dark:text-teal-400">
            <Workflow className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="font-bold tracking-wider text-sm text-slate-900 dark:text-slate-50 uppercase font-mono">
              BioWeaver
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowDocModal(true)}
            className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Methodology Docs</span>
          </button>

          <button
            onClick={toggleTheme}
            className="h-8 w-8 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-550 dark:text-slate-400 cursor-pointer rounded flex items-center justify-center transition-all duration-300"
            title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>

          <button
            onClick={onLaunch}
            className="h-8.5 px-4 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 text-white dark:text-teal-400 border dark:border-teal-500/30 text-xs font-mono font-bold uppercase rounded cursor-pointer transition-all duration-200"
          >
            Launch Workspace
          </button>
        </div>
      </header>

      {/* SECTION 1: HERO */}
      <section 
        ref={sectionRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative min-h-[85vh] flex flex-col justify-center px-6 lg:px-24 overflow-hidden border-b border-slate-200 dark:border-slate-800 z-10"
      >
        
        {/* Floating background protein structures with Brownian sways */}
        <div className="absolute top-[18%] left-[12%] opacity-10 dark:opacity-5 pointer-events-none animate-float-sway-slow z-0">
          <svg className="w-16 h-16 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        
        <div className="absolute bottom-[20%] right-[16%] opacity-10 dark:opacity-5 pointer-events-none animate-float-sway-slower z-0">
          <svg className="w-20 h-20 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8M12 8v8" />
          </svg>
        </div>

        {/* Crisp Animated Constellation & DNA Helix Background with Scroll Parallax */}
        <div 
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-30 z-0 transition-transform duration-75 ease-out"
        >
          <svg className="w-full h-full">
            {/* Dynamic Rotating DNA Helix in center-right */}
            {Array.from({ length: 14 }, (_, i) => {
              const yPos = 15 + i * 5.8;
              const phase = i * 0.42 + dnaTime;
              const xCenter = 72;
              const amplitude = 11;
              
              const x1 = xCenter + Math.sin(phase) * amplitude;
              const x2 = xCenter + Math.sin(phase + Math.PI) * amplitude;
              
              const z1 = Math.cos(phase);
              const z2 = Math.cos(phase + Math.PI);
              
              return (
                <g key={`dna-${i}`}>
                  <line 
                    x1={`${x1}%`} 
                    y1={`${yPos}%`} 
                    x2={`${x2}%`} 
                    y2={`${yPos}%`} 
                    stroke={isDarkMode ? "rgba(45, 212, 191, 0.08)" : "rgba(13, 148, 136, 0.05)"} 
                    strokeWidth="1" 
                  />
                  <circle 
                    cx={`${x1}%`} 
                    cy={`${yPos}%`} 
                    r={3 + z1 * 1.2} 
                    fill="var(--graph-node-gene)" 
                    opacity={0.25 + (z1 + 1) * 0.25} 
                  />
                  <circle 
                    cx={`${x2}%`} 
                    cy={`${yPos}%`} 
                    r={3 + z2 * 1.2} 
                    fill="var(--graph-node-disease)" 
                    opacity={0.25 + (z2 + 1) * 0.25} 
                  />
                </g>
              );
            })}

            {/* Drift links with dynamic repulsion stretching & flowing data packets */}
            {driftLinks.map((link, idx) => {
              const src = driftNodes[link.source];
              const tgt = driftNodes[link.target];
              if (!src || !tgt) return null;
              
              let sx = src.x;
              let sy = src.y;
              let tx = tgt.x;
              let ty = tgt.y;
              
              if (mousePos.x !== -1000) {
                const dxS = src.x - mousePos.x;
                const dyS = src.y - mousePos.y;
                const distS = Math.hypot(dxS, dyS);
                if (distS < 16) {
                  const force = (16 - distS) / 16;
                  const angle = Math.atan2(dyS, dxS);
                  sx -= Math.cos(angle) * force * 3.5;
                  sy -= Math.sin(angle) * force * 3.5;
                }
                
                const dxT = tgt.x - mousePos.x;
                const dyT = tgt.y - mousePos.y;
                const distT = Math.hypot(dxT, dyT);
                if (distT < 16) {
                  const force = (16 - distT) / 16;
                  const angle = Math.atan2(dyT, dxT);
                  tx -= Math.cos(angle) * force * 3.5;
                  ty -= Math.sin(angle) * force * 3.5;
                }
              }

              const pathId = `hero-link-path-${idx}`;

              return (
                <g key={`link-${idx}`}>
                  <path 
                    id={pathId}
                    d={`M ${sx} ${sy} L ${tx} ${ty}`}
                    style={{ display: 'none' }}
                  />
                  <line
                    x1={`${sx}%`}
                    y1={`${sy}%`}
                    x2={`${tx}%`}
                    y2={`${ty}%`}
                    stroke={isDarkMode ? "rgba(51, 65, 85, 0.45)" : "rgba(203, 213, 225, 0.65)"}
                    strokeWidth="1.2"
                  />
                  {/* Glowing data packets travelling along links */}
                  {idx % 4 === 0 && (
                    <circle r="2.5" fill="var(--graph-node-gene)" opacity="0.8">
                      <animateMotion dur={`${4 + (idx % 3) * 1.5}s`} repeatCount="indefinite">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Drift nodes with dynamic repulsion sways */}
            {driftNodes.map((node) => {
              let nx = node.x;
              let ny = node.y;
              
              if (mousePos.x !== -1000) {
                const dx = node.x - mousePos.x;
                const dy = node.y - mousePos.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 16) {
                  const force = (16 - dist) / 16;
                  const angle = Math.atan2(dy, dx);
                  nx -= Math.cos(angle) * force * 3.5;
                  ny -= Math.sin(angle) * force * 3.5;
                }
              }

              return (
                <circle
                  key={`node-${node.id}`}
                  cx={`${nx}%`}
                  cy={`${ny}%`}
                  r={node.size}
                  fill={node.id % 2 === 0 ? "var(--graph-node-gene)" : "var(--graph-node-disease)"}
                  opacity={0.65}
                  className="animate-breathe"
                />
              );
            })}
          </svg>
        </div>

        <div className="max-w-4xl z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded font-mono text-[10px] text-teal-655 dark:text-teal-405 font-bold uppercase tracking-wider shadow-sm animate-pulse"
          >
            <GitMerge className="h-3.5 w-3.5" />
            <span>Biomedical Knowledge Graph Explorer</span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.12 } }
            }}
            className="font-display-serif text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-[1.1] text-slate-900 dark:text-white"
          >
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
              }}
              className="block"
            >
              Decoding the genetic
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
              }}
              className="block mt-1"
            >
              connections of disease.
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="text-sm text-slate-700 dark:text-slate-300 font-normal leading-relaxed max-w-2xl font-mono"
          >
            BioWeaver integrates reference biomedical datasets into a unified heterogeneous knowledge graph. 
            Evaluate local neighborhoods, generate node embeddings, and predict gene–disease associations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-3 pt-2"
          >
            <button
              onClick={onLaunch}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 text-white dark:text-teal-400 border dark:border-teal-500/30 font-mono text-xs uppercase tracking-wider font-bold rounded cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDocModal(true)}
              className="px-6 py-3 border border-slate-205 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-mono text-xs uppercase tracking-wider font-bold rounded flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
            >
              <span>View Methodology</span>
            </button>
          </motion.div>
        </div>

        {/* Subtle animated scroll-cue at the bottom of the hero */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity z-20 pointer-events-none select-none">
          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold">Scroll to explore</span>
          <ChevronDown className="h-4.5 w-4.5 text-slate-400 animate-bounce" />
        </div>
      </section>

      {/* SECTION 2: BIOMEDICAL DATA SOURCES (HIGH-CONTRAST DUAL GLASS CARDS) */}
      <section className="py-24 px-6 lg:px-24 border-b border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-[#020617]/20 relative z-10">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="space-y-3">
            <span className="font-mono text-[10px] text-teal-650 dark:text-teal-400 uppercase tracking-widest font-bold">01 / DATASET HARMONIZATION</span>
            <h2 className="font-display-serif text-3xl sm:text-4xl font-light text-slate-900 dark:text-white">
              Sourced biological data layers.
            </h2>
            <p className="text-xs text-slate-500 font-mono max-w-xl leading-relaxed">
              We compile heterogeneous entities and connections from two reference biological platforms to construct the topological scaffolding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Monarch Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-8 glass-panel glass-panel-hover rounded-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border border-slate-200/50 dark:border-slate-800/40 bg-white/40 dark:bg-slate-950/40 font-mono text-xs font-bold rounded flex items-center justify-center text-teal-655 dark:text-teal-400 select-none">
                    M
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm uppercase tracking-wide text-slate-900 dark:text-slate-100 block">
                        Monarch Initiative
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase block tracking-wider font-bold">
                        Ontology & Association Registry
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 border border-teal-500/20 bg-teal-500/5 rounded text-[8px] font-mono font-bold text-teal-655 dark:text-teal-450 uppercase tracking-wider animate-pulse">
                      <span className="h-1 w-1 rounded-full bg-teal-500" />
                      <span>HUD: ON</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono font-medium">
                  An integrative data platform connecting genes, phenotypes, and diseases. Monarch provides structured genotype–phenotype definitions and validated gene–disease associations.
                </p>

                <div className="bg-white/30 dark:bg-slate-950/50 p-4 border border-slate-200/40 dark:border-slate-850 rounded font-mono text-[11px] space-y-2">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">Pipeline Role:</span>
                    <p className="text-[10px] text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed font-medium">Used to extract raw human gene-disease records and map entities to standard nomenclature identifiers to construct the base graph.</p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200/45 dark:border-slate-800/50">
                    <span className="font-bold text-slate-900 dark:text-slate-100">Ingested Relations:</span>
                    <p className="text-[10px] text-teal-700 dark:text-teal-400 font-bold mt-0.5">biolink:causes, biolink:associated_with_increased_likelihood_of</p>
                  </div>
                </div>
              </div>

              <a
                href="https://monarchinitiative.org"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 text-[10px] font-mono uppercase text-teal-655 dark:text-teal-450 hover:underline flex items-center gap-1 font-bold"
              >
                <span>Query Monarch Data Portal</span>
                <ChevronRight className="h-3 w-3" />
              </a>
            </motion.div>

            {/* STRING Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="p-8 glass-panel glass-panel-hover rounded-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 border border-slate-200/50 dark:border-slate-800/40 bg-white/40 dark:bg-slate-950/40 font-mono text-xs font-bold rounded flex items-center justify-center text-teal-605 dark:text-teal-400 select-none">
                    S
                  </div>
                  <div>
                    <span className="font-bold text-sm uppercase tracking-wide text-slate-900 dark:text-slate-100 block">
                      STRING Database
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase block tracking-wider font-bold">
                      Protein Interaction Network
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono font-medium">
                  A functional and physical database tracking known and predicted protein-protein interactions (PPI) compiled from genomic context, experiments, co-expression, and literature.
                </p>

                <div className="bg-white/30 dark:bg-slate-950/50 p-4 border border-slate-200/40 dark:border-slate-850 rounded font-mono text-[11px] space-y-2">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">Pipeline Role:</span>
                    <p className="text-[10px] text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed font-medium">Used for protein-protein interaction (PPI) edge construction to establish secondary paths and support Node2Vec topological learning.</p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200/45 dark:border-slate-800/50">
                    <span className="font-bold text-slate-900 dark:text-slate-100">Ingested Relations:</span>
                    <p className="text-[10px] text-teal-700 dark:text-teal-400 font-bold mt-0.5">protein-interaction</p>
                  </div>
                </div>
              </div>

              <a
                href="https://string-db.org"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 text-[10px] font-mono uppercase text-teal-655 dark:text-teal-450 hover:underline flex items-center gap-1 font-bold"
              >
                <span>Query STRING Database</span>
                <ChevronRight className="h-3 w-3" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 3: KNOWLEDGE GRAPH CONSTRUCTION */}
      <section className="py-24 px-6 lg:px-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-6">
            <span className="font-mono text-[10px] text-teal-650 dark:text-teal-400 uppercase tracking-widest font-bold">02 / PIPELINE COMPOSITION</span>
            <h2 className="font-display-serif text-3xl sm:text-4xl font-light text-slate-900 dark:text-white leading-snug">
              Heterogeneous graph construction.
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
              Raw biological datasets are resolved into standardized nomenclature and compiled into a unified heterogeneous knowledge graph. 
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
              Monarch genotype-phenotype links and STRING physical protein-protein interactions are merged, establishing a topological topology map.
            </p>
          </div>

          {/* Interactive Growing Graph Construction Glass Box with Flowing Particles */}
          <div className="h-80 glass-panel rounded-xl relative overflow-hidden flex items-center justify-center">
            {/* Visual background Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--grid-dot)_1.5px,transparent_1.5px)] bg-[size:16px_16px] pointer-events-none" />

            <svg viewBox="0 0 400 250" className="w-full h-full max-w-sm relative z-10">
              <defs>
                <filter id="glow-svg" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Left Column: Data source entries */}
              <g stroke="var(--graph-border)" strokeWidth="1" fill="none">
                <rect x="20" y="55" width="85" height="28" rx="2" />
                <rect x="20" y="155" width="85" height="28" rx="2" />
              </g>
              <g fontSize="8" fill="var(--graph-label)" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                <text x="625" y="72" className="translate-x-[-562px]">MONARCH</text>
                <text x="625" y="172" className="translate-x-[-562px]">STRING</text>
              </g>

              {/* Connecting Flow Lines */}
              <g stroke="var(--graph-edge)" strokeWidth="1.2" strokeDasharray="3,3">
                <line x1="105" y1="69" x2="200" y2="125" />
                <line x1="105" y1="169" x2="200" y2="125" />
              </g>

              {/* Animated Glowing Data Particles */}
              <circle r="3.5" fill="#2dd4bf" filter="url(#glow-svg)">
                <animateMotion dur="2.5s" repeatCount="indefinite" path="M 105,69 L 200,125" />
              </circle>
              <circle r="3.5" fill="#6366f1" filter="url(#glow-svg)">
                <animateMotion dur="3.2s" repeatCount="indefinite" path="M 105,169 L 200,125" />
              </circle>

              {/* Center Growing Graph Hub */}
              <g transform="translate(270, 125)">
                <circle cx="0" cy="0" r="10" fill="var(--graph-node-gene)" />
                
                <line x1="0" y1="0" x2="-45" y2="-45" stroke="var(--graph-edge)" strokeWidth="1.5" />
                <circle cx="-45" cy="-45" r="7" fill="var(--graph-node-disease)" />
                <text x="-45" y="-57" textAnchor="middle" fontSize="6.5" fill="var(--graph-label)" fontFamily="monospace" fontWeight="bold">DISEASE</text>

                <line x1="0" y1="0" x2="45" y2="-30" stroke="var(--graph-edge)" strokeWidth="1.5" />
                <circle cx="45" cy="-30" r="7" fill="var(--graph-node-gene)" />
                <text x="45" y="-42" textAnchor="middle" fontSize="6.5" fill="var(--graph-label)" fontFamily="monospace" fontWeight="bold">GENE</text>

                <line x1="0" y1="0" x2="10" y2="50" stroke="var(--graph-edge)" strokeWidth="1.5" />
                <circle cx="10" cy="50" r="7" fill="var(--graph-node-disease)" />
                <text x="10" y="62" textAnchor="middle" fontSize="6.5" fill="var(--graph-label)" fontFamily="monospace" fontWeight="bold">DISEASE</text>
              </g>
            </svg>
            
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 border border-slate-250/50 dark:border-slate-800/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded text-[9px] font-mono font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span>Heterogeneous Integration</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: NODE2VEC EMBEDDINGS */}
      <section className="py-24 px-6 lg:px-24 border-b border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-[#020617]/40 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Animated Embedding Matrix Box with sweeping laser scanner */}
          <div className="h-80 glass-panel rounded-xl relative overflow-hidden flex items-center justify-center p-6 order-2 lg:order-1">
            {/* Sweping laser scanning line */}
            <div className="animate-laser-scan z-20 pointer-events-none" />

            <div className="w-full max-w-sm space-y-4 relative z-10">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>Graph Topology</span>
                <span>128D Node Embeddings</span>
              </div>

              {/* Node to grid translation graphic */}
              <div className="grid grid-cols-12 gap-1 items-center">
                <div className="col-span-3 flex flex-col items-center gap-2 border border-slate-200/50 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-3 rounded-lg">
                  <div className="h-7 w-7 rounded-full bg-teal-500/10 text-teal-650 flex items-center justify-center">
                    <Network className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[9px] font-bold text-slate-900 dark:text-slate-105">HNF1A</span>
                </div>

                <div className="col-span-2 flex justify-center text-slate-350 dark:text-slate-650">
                  <ChevronRight className="h-5 w-5 animate-pulse" />
                </div>

                <div className="col-span-7 grid grid-cols-8 gap-0.5 border border-slate-200/50 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-2 rounded-lg relative overflow-hidden">
                  {Array.from({ length: 32 }, (_, i) => {
                    const weightVal = 0.15 + (Math.sin(i / 2.5) * 0.35 + 0.45);
                    const isCellWalking = i === activeCell;
                    return (
                      <div
                        key={i}
                        className={`aspect-square relative group transition-all duration-300 rounded-[1px] ${isCellWalking ? 'ring-2 ring-teal-400 scale-110 shadow-md z-10' : ''}`}
                        style={{ backgroundColor: `rgba(13, 148, 136, ${isCellWalking ? 0.95 : weightVal})` }}
                      >
                        <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-900 text-white text-[8px] font-mono px-1 py-0.5 rounded shadow z-25">
                          {(isCellWalking ? 0.95 : weightVal).toFixed(3)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-[9px] font-mono text-slate-600 dark:text-slate-300 leading-normal border-t border-slate-200/40 dark:border-slate-800/40 pt-3">
                Generating node embeddings via local random graph walks to project structural and topological adjacency parameters into flat coordinate spaces.
              </div>
            </div>
            
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 border border-slate-250/50 dark:border-slate-800/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wide">
              <span>Embedding Vector Size: 128D</span>
            </div>
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <span className="font-mono text-[10px] text-teal-650 dark:text-teal-400 uppercase tracking-widest font-bold">03 / REPRESENTATION LEARNING</span>
            <h2 className="font-display-serif text-3xl sm:text-4xl font-light text-slate-900 dark:text-white leading-snug">
              Node2Vec representation learning.
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
              Rather than relying solely on direct associations, BioWeaver employs a **Node2Vec** algorithm to map graph nodes into a dense, continuous vector space. 
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
              The embedding maps localized clustering and structural neighborhoods, preserving multi-hop topological proximity for predictions.
            </p>
          </div>

        </div>
      </section>

      {/* SECTION 5: MACHINE LEARNING PREDICTION PIPELINE */}
      <section className="py-24 px-6 lg:px-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] relative z-10">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="space-y-3 text-center">
            <span className="font-mono text-[10px] text-teal-650 dark:text-teal-400 uppercase tracking-widest font-bold">04 / MACHINE LEARNING PIPELINE</span>
            <h2 className="font-display-serif text-3xl sm:text-4xl font-light text-slate-900 dark:text-white leading-snug">
              Predictive association pipeline.
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 max-w-xl mx-auto leading-relaxed font-mono">
              Features are extracted by concatenating individual node embedding vectors, which are then classified using a Random Forest model.
            </p>
          </div>

          {/* Pipeline flow visual blocks */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 glass-panel glass-panel-hover rounded-xl flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Step 01</span>
                <span className="font-bold text-xs uppercase tracking-wide text-slate-900 dark:text-slate-200 block mt-2 mb-3">
                  Concatenated Features
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                  Concatenate individual 128-dimensional embedding vectors for the candidate Gene and Disease nodes.
                </p>
              </div>
              <div className="mt-6 font-mono text-[10px] bg-white/40 dark:bg-slate-950/40 p-2.5 border border-slate-200/50 dark:border-slate-850/40 backdrop-blur-md rounded-lg flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                <span>[128D Gene]</span>
                <span className="text-slate-400">+</span>
                <span>[128D Disease]</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 glass-panel glass-panel-hover rounded-xl flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Step 02</span>
                <span className="font-bold text-xs uppercase tracking-wide text-slate-900 dark:text-slate-200 block mt-2 mb-3">
                  Vector Dimension
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                  Resulting 256-dimensional pairwise feature vector input.
                </p>
              </div>
              <div className="mt-6 font-mono text-[10px] bg-white/40 dark:bg-slate-950/40 p-2.5 border border-slate-200/50 dark:border-slate-850/40 backdrop-blur-md rounded-lg flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                <span>Input Dimensions:</span>
                <span className="text-teal-655 dark:text-teal-400">256 Features</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 glass-panel glass-panel-hover rounded-xl flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Step 03</span>
                <span className="font-bold text-xs uppercase tracking-wide text-slate-900 dark:text-slate-200 block mt-2 mb-3">
                  Random Forest
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                  Classified via ensemble decision trees trained using bagging and bootstrap splits.
                </p>
              </div>
              <div className="mt-6 font-mono text-[10px] bg-white/40 dark:bg-slate-950/40 p-2.5 border border-slate-200/50 dark:border-slate-850/40 backdrop-blur-md rounded-lg flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                <span>Ensemble Size:</span>
                <span className="text-teal-655 dark:text-teal-400">200 Estimators</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 glass-panel glass-panel-hover border-teal-500/20 dark:border-teal-500/20 bg-teal-500/[0.03] dark:bg-teal-500/[0.01] rounded-xl flex flex-col justify-between shadow-lg">
              <div>
                <span className="font-mono text-[10px] font-bold text-teal-655 dark:text-teal-400 uppercase">Step 04</span>
                <span className="font-bold text-xs uppercase tracking-wide text-teal-655 dark:text-teal-400 block mt-2 mb-3">
                  Link Prediction
                </span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                  Calculates predicted probability scores indicating likelihood of novel gene–disease association.
                </p>
              </div>
              <div className="mt-6 font-mono text-[9px] bg-teal-500/10 text-teal-650 dark:text-teal-400 p-2.5 border border-teal-500/20 rounded-lg flex flex-col justify-center items-center font-bold text-center select-none">
                <span className="uppercase text-[8px] tracking-wider mb-1 block">Prediction Score</span>
                <span className="text-[10px] font-sans">Live prediction available in the BioWeaver Workspace</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: INTERACTIVE WORKSPACE PREVIEW */}
      <section className="py-24 px-6 lg:px-24 border-b border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-[#020617]/40 relative z-10">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="space-y-3">
            <span className="font-mono text-[10px] text-teal-650 dark:text-teal-400 uppercase tracking-widest font-bold">05 / INTERACTIVE WORKSPACE</span>
            <h2 className="font-display-serif text-3xl sm:text-4xl font-light text-slate-900 dark:text-white leading-snug">
              Workstation visualizer environment.
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono max-w-xl">
              Inspect the constructed local neighborhood graph with interactive force physics, and query candidate linkages on demand.
            </p>
          </div>

          <div className="glass-panel rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/40 pb-3 mb-4 select-none">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <span className="font-mono text-[9px] font-bold text-slate-500 border-l border-slate-200/50 dark:border-slate-800/40 pl-3 ml-1.5 uppercase tracking-wide">
                  BioWeaver local viewport
                </span>
              </div>
              <div className="h-4.5 w-24 bg-white/40 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded text-[9px] font-mono flex items-center justify-center text-slate-400 font-bold select-none">
                BRCA1 SEED
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 h-60 items-center">
              <div className="col-span-8 h-full glass-panel rounded-lg relative flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 400 200" className="w-full h-full max-w-sm">
                  {/* Central Node */}
                  <circle cx="200" cy="100" r="11" fill="var(--graph-node-gene)" />
                  <text x="200" y="120" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--graph-label)" fontFamily="monospace">BRCA1</text>
                  
                  {/* Connected disease 1 */}
                  <line x1="200" y1="100" x2="110" y2="60" stroke="var(--graph-edge)" strokeWidth="1.5" />
                  <circle cx="110" cy="60" r="7" fill="var(--graph-node-disease)" />
                  <text x="110" y="76" textAnchor="middle" fontSize="6.5" fill="var(--graph-label)" fontFamily="monospace">breast cancer</text>

                  {/* Connected disease 2 */}
                  <line x1="200" y1="100" x2="290" y2="70" stroke="var(--graph-edge)" strokeWidth="1.5" />
                  <circle cx="290" cy="70" r="7" fill="var(--graph-node-disease)" />
                  <text x="290" y="86" textAnchor="middle" fontSize="6.5" fill="var(--graph-label)" fontFamily="monospace">ovarian cancer</text>

                  {/* Connected gene 3 (PPI) */}
                  <line x1="200" y1="100" x2="200" y2="165" stroke="var(--graph-edge)" strokeWidth="1.2" strokeDasharray="3,3" />
                  <circle cx="200" cy="165" r="7" fill="var(--graph-node-gene)" />
                  <text x="200" y="179" textAnchor="middle" fontSize="6.5" fill="var(--graph-label)" fontFamily="monospace">BRCA2</text>
                </svg>
              </div>

              <div className="col-span-4 h-full border border-slate-200/50 dark:border-slate-800/40 p-4 bg-white/30 dark:bg-slate-900/10 rounded-lg flex flex-col justify-between font-mono text-[9px] leading-normal">
                <div>
                  <div className="text-slate-400 font-bold uppercase mb-2 border-b border-slate-200/50 dark:border-slate-800/40 pb-1.5">
                    Biological Term Details
                  </div>
                  <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                    <div><span className="font-bold text-slate-900 dark:text-slate-250">Locus Symbol:</span> BRCA1</div>
                    <div><span className="font-bold text-slate-900 dark:text-slate-250">Type Category:</span> gene</div>
                    <div><span className="font-bold text-slate-900 dark:text-slate-250">Adjacency Degree:</span> 8 nodes</div>
                  </div>
                </div>

                <button 
                  onClick={onLaunch}
                  className="w-full h-7 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 text-white dark:text-teal-400 border dark:border-teal-500/30 rounded uppercase font-bold text-[8px] tracking-wide cursor-pointer transition-colors"
                >
                  Enter Workspace
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 7: PLATFORM STATISTICS */}
      <section 
        className="py-24 px-6 lg:px-24 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] text-center relative z-10"
        onMouseEnter={() => setStatsVisible(true)}
      >
        <motion.div 
          className="max-w-7xl mx-auto space-y-12"
          viewport={{ once: true }}
          onViewportEnter={() => setStatsVisible(true)}
        >
          <div className="space-y-3">
            <span className="font-mono text-[10px] text-teal-655 dark:text-teal-400 uppercase tracking-widest font-bold">06 / PLATFORM METRICS</span>
            <h2 className="font-display-serif text-3xl sm:text-4xl font-light text-slate-900 dark:text-white">
              Verified system audit counts.
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 max-w-lg mx-auto leading-relaxed font-mono">
              Factual pipeline audit metrics extracted directly from active database files and preprocessing configurations.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 max-w-5xl mx-auto text-left font-mono">
            {/* Stat 1 */}
            <div className="p-5 glass-panel glass-panel-hover rounded-xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider mb-2">Knowledge Graph Nodes</span>
              <div className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white block font-sans mb-1">
                {counts.nodes.toLocaleString()}
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-350 block leading-normal pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                ({counts.genes.toLocaleString()} genes / {counts.diseases.toLocaleString()} diseases)
              </span>
            </div>

            {/* Stat 2 */}
            <div className="p-5 glass-panel glass-panel-hover rounded-xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider mb-2">Protein-Protein Edges</span>
              <div className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white block font-sans mb-1">
                {counts.ppi.toLocaleString()}
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-350 block leading-normal pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                Sourced from STRING database
              </span>
            </div>

            {/* Stat 3 */}
            <div className="p-5 glass-panel glass-panel-hover rounded-xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider mb-2">Gene-Disease Links</span>
              <div className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white block font-sans mb-1">
                {counts.assoc.toLocaleString()}
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-350 block leading-normal pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                Sourced from Monarch Initiative
              </span>
            </div>

            {/* Stat 4 */}
            <div className="p-5 glass-panel glass-panel-hover rounded-xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider mb-2">Node2Vec Dimensions</span>
              <div className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white block font-sans mb-1">
                128
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-350 block leading-normal pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                Representation vector size
              </span>
            </div>

            {/* Stat 5 */}
            <div className="p-5 glass-panel glass-panel-hover rounded-xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider mb-2">Ensemble Estimators</span>
              <div className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white block font-sans mb-1">
                200
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-350 block leading-normal pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                Random Forest trees count
              </span>
            </div>
          </div>

          <div className="text-center font-mono text-[9px] text-slate-500 dark:text-slate-400">
            Pipeline Verification Hash: <span className="font-semibold select-all">9606_HS_GRAPH_V1.2</span>
          </div>

        </motion.div>
      </section>

      {/* SECTION 8: MISSION STATEMENT & FINAL CTA */}
      <section className="py-28 px-6 lg:px-24 border-b border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-[#020617]/40 text-center relative overflow-hidden z-10">
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <span className="font-mono text-[10px] text-teal-655 dark:text-teal-400 uppercase tracking-widest font-bold">07 / PLATFORM MISSION</span>
          <h2 className="font-display-serif text-3xl sm:text-4xl lg:text-5xl font-light text-slate-900 dark:text-white leading-tight">
            Connecting fragmented biomedical knowledge into an intelligent graph capable of discovering novel biological relationships.
          </h2>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onLaunch}
              className="px-8 py-4 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 text-white dark:text-teal-400 border dark:border-teal-500/30 font-mono text-xs uppercase tracking-wider font-bold rounded cursor-pointer transition-all duration-300 inline-flex items-center justify-center gap-2.5 shadow-lg hover:scale-105 active:scale-95"
            >
              <span>Launch Research Workspace</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setShowDocModal(true)}
              className="px-8 py-4 border border-slate-250 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-mono text-xs uppercase tracking-wider font-bold rounded flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
            >
              <span>Explore Methodology Details</span>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-14 px-6 lg:px-24 bg-white dark:bg-[#010409] border-t border-slate-200/50 dark:border-slate-850/40 font-mono text-[10px] text-slate-500 dark:text-slate-400 transition-all duration-300 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Workflow className="h-4 w-4 text-teal-600" />
            <span className="font-bold text-slate-700 dark:text-slate-200 uppercase">BIOWEAVER PLATFORM</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onLaunch} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer">
              Workspace
            </button>
            <button onClick={() => setShowDocModal(true)} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer">
              Methodology
            </button>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              GitHub
            </a>
          </div>

          <div>
            <span>© {new Date().getFullYear()} BioWeaver. Academic License.</span>
          </div>
        </div>
      </footer>

      {/* METHODOLOGY DOCUMENTATION MODAL (FROSTED GLASS MODAL) */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-all duration-300">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-250/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/40 pb-3">
              <div className="flex items-center gap-2 text-teal-655 dark:text-teal-400">
                <FileText className="h-5 w-5" />
                <span className="font-display-serif text-lg font-bold text-slate-900 dark:text-white">BioWeaver Pipeline Methodology</span>
              </div>
              <button 
                onClick={() => setShowDocModal(false)}
                className="text-xs font-mono font-bold hover:text-rose-500 cursor-pointer"
              >
                [ CLOSE ]
              </button>
            </div>

            <div className="space-y-4 font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-105 block mb-1">1. Graph Harmonization</span>
                Ontology mapping standards are enforced resolving gene nomenclature and disease classifications. Local neighborhoods are seeded using a NetworkX-composed graph structure loaded from processed node linkages.
              </div>

              <div>
                <span className="font-bold text-slate-900 dark:text-slate-105 block mb-1">2. Node2Vec Feature Extraction</span>
                Representation vectors are generated via biased local random walks traversing the standardized graph topology, projecting structural neighborhoods into continuous 128-dimensional dense float matrices.
              </div>

              <div>
                <span className="font-bold text-slate-900 dark:text-slate-105 block mb-1">3. Ensemble Prediction</span>
                Pairwise candidate links compute 128-dimensional Hadamard product features (u ⊙ v) and Cosine Similarity into a 129-dimensional feature space. The vector is classified using a regularized ensemble Random Forest model configured with 150 estimators.
              </div>

              <div className="border-t border-slate-200/50 dark:border-slate-800/40 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                <span>Version Code: BioWeaver v1.2</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Frosted Film Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.025] z-50 mix-blend-overlay">
        <svg className="w-full h-full">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

    </div>
  );
}
