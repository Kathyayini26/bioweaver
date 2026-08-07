import { 
  Home, 
  LayoutDashboard, 
  Dna, 
  Activity, 
  Binary, 
  BarChart3, 
  Share2, 
  Info,
  Database
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  const menuItems = [
    { id: 'landing', label: 'Gateway', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'gene-search', label: 'Gene Search', icon: Dna },
    { id: 'disease-search', label: 'Disease Search', icon: Activity },
    { id: 'prediction', label: 'Predictor', icon: Binary },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'knowledge-graph', label: 'Knowledge Graph', icon: Share2 },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="h-14 border-b border-slate-800 flex items-center px-6 gap-3 shrink-0">
        <Dna className="h-5 w-5 text-teal-400 animate-pulse" />
        <span className="font-semibold tracking-wider text-sm text-slate-50 uppercase">
          BioWeaver
        </span>
        <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 font-mono px-1.5 py-0.5 rounded-md leading-none">
          v1.0
        </span>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 mb-2">
          Research Tools
        </div>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-600/10 border-l-2 border-teal-500 text-teal-400 bg-teal-500/10'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom Service Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] space-y-2 shrink-0">
        <div className="flex items-center justify-between text-slate-400 font-semibold">
          <span>SERVICE STATUS</span>
          <div className="flex items-center gap-1.5 text-teal-400 font-normal">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span>Online</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
          <Database className="h-3 w-3" />
          <span>Local Mock Sandbox</span>
        </div>
      </div>
    </aside>
  );
}
