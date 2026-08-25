import { useState, useEffect, useRef } from 'react';
import { GraphCanvas } from './components/GraphCanvas';
import { ResearchPanel } from './components/ResearchPanel';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Alert, AlertTitle, AlertDescription } from './components/ui/alert';
import { getLocalSubgraph, getGenesList, getRealSubgraph } from './services/api';
import type { SubgraphData, RealSubgraphData } from './types';
import { 
  Search, 
  Sun, 
  Moon,
  Workflow,
  Database,
  Cpu,
  GitMerge,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { LandingPage } from './components/LandingPage';

function App() {
  const [currentPath, setCurrentPath] = useState(() => {
    const path = window.location.pathname;
    return path === '/workspace' ? '/workspace' : '/';
  });
  const [centerNode, setCenterNode] = useState<string | null>(null); // seed node
  const [focusedNode, setFocusedNode] = useState<string | null>(null); // focused node for research details
  const [subgraph, setSubgraph] = useState<SubgraphData | null>(null);
  const [realSubgraph, setRealSubgraph] = useState<RealSubgraphData | null>(null);
  const [minScore, setMinScore] = useState(0.7);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allNodesList, setAllNodesList] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // API Loading & Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dismissError, setDismissError] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Listen to popstate browser routing events
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };

  // Keyboard shortcut listener (Ctrl/Cmd + K) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize theme, defaulting to dark mode if none is stored
  useEffect(() => {
    const root = window.document.documentElement;
    const storedTheme = localStorage.getItem('theme');
    const isDark = storedTheme === 'dark' || !storedTheme;
    
    if (isDark) {
      root.classList.add('dark');
      setIsDarkMode(true);
      if (!storedTheme) {
        localStorage.setItem('theme', 'dark');
      }
    } else {
      root.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Load searchable nodes list once on mount (genes only for gene-centric search)
  useEffect(() => {
    getGenesList()
      .then((gList) => {
        setAllNodesList(gList);
      })
      .catch(() => {
        // Soft fail suggestions, but don't crash workspace
      });
  }, []);

  // Fetch local subgraph when center node or score threshold changes
  useEffect(() => {
    if (!centerNode) return;
    setLoading(true);
    setError(false);
    setDismissError(false);

    getLocalSubgraph(centerNode, minScore)
      .then(res => {
        if (res) {
          setSubgraph(res);
          setCenterNode(res.center.label);
          setFocusedNode(res.center.label);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });

    // Also fetch the structured real subgraph for the Associations panel
    getRealSubgraph(centerNode)
      .then(real => {
        setRealSubgraph(real);
      })
      .catch(() => {
        setRealSubgraph(null);
      });
  }, [centerNode, minScore]);

  // Search input autocomplete logic
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      const filtered = allNodesList.filter(n => 
        n.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5); // limit 5 suggestions
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if query exists in ontology list
    const matched = allNodesList.find(n => n.toLowerCase() === searchQuery.trim().toLowerCase());
    if (matched) {
      setCenterNode(matched);
      setFocusedNode(matched);
      setShowSuggestions(false);
    } else {
      // Direct jump fallback
      setCenterNode(searchQuery.trim());
      setFocusedNode(searchQuery.trim());
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (node: string) => {
    setCenterNode(node);
    setFocusedNode(node);
    setSearchQuery(node);
    setShowSuggestions(false);
  };

  return (
    <AnimatePresence mode="wait">
      {currentPath === '/workspace' ? (
        <motion.div
          key="workspace"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col h-screen w-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300"
        >
          {/* Top Navigation Workspace Header */}
          <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#010409] text-slate-900 dark:text-slate-100 flex items-center justify-between px-6 shrink-0 z-20 transition-all duration-300">
            {/* Brand/Subtitle - Clickable to return to landing */}
            <div 
              className="flex items-center gap-3 cursor-pointer select-none hover:opacity-80 transition-opacity" 
              onClick={() => navigate('/')}
              title="Return to Home Landing Page"
            >
              <div className="p-1.5 bg-teal-500/10 rounded-md text-teal-600 dark:text-teal-400">
                <Workflow className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-wider text-sm text-slate-900 dark:text-slate-50 uppercase font-mono">
                    BioWeaver Workspace
                  </span>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-teal-600 dark:text-teal-400 font-mono px-1.5 py-0.5 rounded leading-none font-bold uppercase">
                    v1.2 Research
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                  Biomedical Knowledge Graph Exploration Platform
                </p>
              </div>
            </div>

            {/* Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-80 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <Input
                  ref={searchInputRef}
                  id="global-search-input"
                  placeholder="Search genes (e.g. BRCA1, BRCA2, HTT)..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="pl-8.5 pr-12 h-8.5 text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-md focus-visible:ring-teal-500"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSuggestions([]);
                      setShowSuggestions(false);
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer flex items-center justify-center transition-colors"
                    title="Clear Search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : (
                  <div className="absolute right-2 top-2 h-4.5 px-1 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[9px] text-slate-500 dark:text-slate-400 font-sans flex items-center gap-0.5 select-none pointer-events-none transition-colors duration-300">
                    <span>⌘</span><span>K</span>
                  </div>
                )}
              </div>

              {/* Autocomplete List Box */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg z-30 font-mono text-[11px] overflow-hidden transition-all duration-300">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-355 hover:text-slate-900 dark:hover:text-slate-50 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/40 last:border-b-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Persistent Status Monitor */}
            <div className="flex items-center gap-4 text-[10px] font-mono select-none">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Database className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                <span>DB Status:</span>
                <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" /> Connected
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-4 transition-all duration-300">
                <GitMerge className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                <span>KG Nodes:</span>
                <span className="text-slate-700 dark:text-slate-200 font-bold">Loaded</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-4 transition-all duration-300">
                <Cpu className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                <span>Models:</span>
                <span className="text-teal-650 dark:text-teal-400 font-bold">Ready</span>
              </div>

              {/* Theme switcher button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0 ml-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-550 dark:text-slate-400 cursor-pointer rounded transition-all duration-300 hover:scale-105 active:scale-95"
                title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
              >
                <div className={`transition-transform duration-500 ${isDarkMode ? 'rotate-180' : 'rotate-0'}`}>
                  {isDarkMode ? (
                    <Sun className="h-4 w-4 text-amber-500 animate-spin-slow" />
                  ) : (
                    <Moon className="h-4 w-4 text-slate-700" />
                  )}
                </div>
              </Button>
            </div>
          </header>

          {/* Main Workspace split */}
          <main className="flex-1 flex overflow-hidden w-full">
            {/* LEFT PANEL: Graph Canvas Explorer (70%) */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
              {error && !dismissError && (
                <div className="mb-4 shrink-0 relative">
                  <Alert variant="danger" className="w-full pr-10">
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>
                      Unable to retrieve data from the BioWeaver backend. Please verify your connection status.
                    </AlertDescription>
                  </Alert>
                  <button
                    type="button"
                    onClick={() => setDismissError(true)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer flex items-center justify-center"
                    title="Dismiss warning"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Graphical Loading Node-Link Skeleton */}
              {loading && !subgraph && (
                <div className="absolute inset-0 bg-slate-50/70 dark:bg-slate-950/70 flex flex-col items-center justify-center z-10 p-8 transition-all duration-300">
                  <div className="w-full max-w-lg flex flex-col items-center">
                    <svg viewBox="0 0 400 250" className="w-64 h-48 opacity-25 dark:opacity-15 animate-pulse text-slate-400 dark:text-slate-650 mb-4 overflow-visible">
                      <circle cx="200" cy="125" r="14" fill="currentColor" />
                      <line x1="200" y1="125" x2="120" y2="70" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" />
                      <line x1="200" y1="125" x2="280" y2="70" stroke="currentColor" strokeWidth="2" />
                      <line x1="200" y1="125" x2="200" y2="200" stroke="currentColor" strokeWidth="2" />
                      <line x1="200" y1="125" x2="90" y2="160" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" />
                      <line x1="200" y1="125" x2="310" y2="160" stroke="currentColor" strokeWidth="2" />

                      <circle cx="120" cy="70" r="8" fill="currentColor" />
                      <circle cx="280" cy="70" r="8" fill="currentColor" />
                      <circle cx="200" cy="200" r="8" fill="currentColor" />
                      <circle cx="90" cy="160" r="8" fill="currentColor" />
                      <circle cx="310" cy="160" r="8" fill="currentColor" />
                    </svg>
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500 border-t-transparent"></div>
                      <span className="text-[11px] text-slate-500 font-semibold mt-2">Resolving structural neighborhood...</span>
                    </div>
                  </div>
                </div>
              )}
              {subgraph ? (
                <GraphCanvas
                  subgraph={subgraph}
                  centerNode={centerNode}
                  focusedNode={focusedNode}
                  onNodeClick={(label) => setFocusedNode(label)}
                  onNodeDoubleClick={(label) => {
                    setCenterNode(label);
                    setFocusedNode(label);
                  }}
                  minScore={minScore}
                  setMinScore={setMinScore}
                />
              ) : (
                /* Guided Empty State */
                <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded bg-white/40 dark:bg-slate-900/10 select-none">
                  <Workflow className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
                    Search for a gene to begin exploration.
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT PANEL: Research Sidebar Details (30%) */}
            <ResearchPanel 
              subgraph={subgraph}
              realSubgraph={realSubgraph}
              centerNodeLabel={centerNode}
              focusedNodeLabel={focusedNode}
              loading={loading}
              onNodeFocus={(label) => setFocusedNode(label)}
            />
          </main>
        </motion.div>
      ) : (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LandingPage 
            onLaunch={() => navigate('/workspace')} 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
