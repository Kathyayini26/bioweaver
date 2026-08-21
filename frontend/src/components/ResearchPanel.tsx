import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { Badge } from './ui/badge';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getTermDetails, 
  getSystemAnalytics, 
  predictAssociation
} from '../services/api';
import * as mock from '../services/mockData';
import type { TermDetails, SystemAnalytics, PredictionResult, SubgraphData, RealSubgraphData } from '../types';
import { 
  Dna, 
  Activity, 
  Database, 
  Cpu, 
  CheckCircle2, 
  XCircle,
  Network
} from 'lucide-react';

interface ResearchPanelProps {
  subgraph: SubgraphData | null;
  realSubgraph: RealSubgraphData | null;
  centerNodeLabel: string | null;
  focusedNodeLabel: string | null;
  loading?: boolean;
  onNodeFocus: (nodeLabel: string) => void;
}

export function ResearchPanel({ subgraph, realSubgraph, centerNodeLabel, focusedNodeLabel, loading, onNodeFocus }: ResearchPanelProps) {
  // Details state
  const [details, setDetails] = useState<TermDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(false);

  // Extract visible neighbors in the currently rendered subgraph
  const visibleAssociations: Array<{ neighbor: string; type: string; relationship: string; score: number }> = [];
  if (subgraph && details) {
    subgraph.edges.forEach(edge => {
      const sId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
      const tId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;
      const isConnected = sId === details.label || tId === details.label;
      if (isConnected) {
        const neighborLabel = sId === details.label ? tId : sId;
        const neighborNode = subgraph.nodes.find(n => n.label === neighborLabel || n.id === neighborLabel);
        if (neighborNode) {
          visibleAssociations.push({
            neighbor: neighborNode.label,
            type: neighborNode.type,
            relationship: edge.predicate.replace('biolink:', '').replace(/_/g, ' '),
            score: edge.score
          });
        }
      }
    });
  }

  // Stats state
  const [stats, setStats] = useState<SystemAnalytics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  // Predictor state
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState(false);

  // Active tab state
  const [activeTab, setActiveTab] = useState('details');

  // Fetch Term Details when focused node changes
  useEffect(() => {
    if (!focusedNodeLabel) return;
    setDetailsLoading(true);
    setDetailsError(false);
    setPrediction(null); // clear old predictions

    getTermDetails(focusedNodeLabel)
      .then(res => {
        setDetails(res);
        setDetailsLoading(false);
      })
      .catch(() => {
        setDetailsError(true);
        setDetailsLoading(false);
      });
  }, [focusedNodeLabel]);

  // Fetch Global Stats once on load
  useEffect(() => {
    getSystemAnalytics()
      .then(res => {
        setStats(res);
        setStatsLoading(false);
      })
      .catch(() => {
        setStatsError(true);
        setStatsLoading(false);
      });
  }, []);

  const showPredictTab = details?.type === 'disease';

  // Automatically reset tab to details if the new focused node is not a disease
  useEffect(() => {
    if (!showPredictTab && activeTab === 'predict') {
      setActiveTab('details');
    }
  }, [showPredictTab, activeTab]);

  // Run AI Predictor automatically for focused disease-gene pairs
  const runBackendPredict = () => {
    if (!centerNodeLabel || !focusedNodeLabel) return;
    setPredictLoading(true);
    setPredictError(false);
    setPrediction(null);

    predictAssociation(centerNodeLabel, focusedNodeLabel)
      .then(res => {
        setPrediction(res);
        setPredictLoading(false);
      })
      .catch(() => {
        setPredictError(true);
        setPredictLoading(false);
      });
  };

  useEffect(() => {
    if (details?.type === 'disease' && centerNodeLabel && focusedNodeLabel) {
      runBackendPredict();
    }
  }, [details, centerNodeLabel, focusedNodeLabel]);

  // Clean empty state placeholder when no gene search is active
  if (!centerNodeLabel) {
    return (
      <div className="w-[30%] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full items-center justify-center p-6 text-center select-none font-mono transition-colors duration-300">
        <Cpu className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Research Workspace</span>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs mt-1 leading-normal">
          Search for a gene to begin exploration.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-[30%] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden shrink-0 transition-colors duration-300"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full overflow-hidden">
        {/* Tab Selection Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-2 bg-slate-55 dark:bg-slate-900/40 shrink-0 transition-colors duration-300">
          <TabsList className="w-full justify-start gap-1 bg-slate-100 dark:bg-slate-800 p-1">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="associations">Associations</TabsTrigger>
            {showPredictTab && <TabsTrigger value="predict">Predictive Validation</TabsTrigger>}
            <TabsTrigger value="stats">Platform</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents Frame */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: TERM DETAILS */}
          <TabsContent value="details" className="mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={detailsLoading ? 'loading' : (details ? details.id : 'empty')}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="space-y-5"
              >
                {detailsLoading && (
                  <div className="space-y-5 animate-pulse">
                    {/* Node details skeleton card */}
                    <Card>
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-md shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                          </div>
                        </div>
                        <div className="border-t border-slate-100 dark:border-slate-800/50 pt-3 space-y-2">
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-4/6" />
                        </div>
                        <div className="border-t border-slate-100 dark:border-slate-800/50 pt-3 space-y-2">
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Embedding skeleton card */}
                    <Card>
                      <CardHeader className="pb-1">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                      </CardHeader>
                      <CardContent className="pt-2 space-y-2">
                        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {detailsError && (
                  <Alert variant="danger">
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>
                      Unable to retrieve data from the BioWeaver backend.
                    </AlertDescription>
                  </Alert>
                )}

                {!detailsLoading && !detailsError && !details && (
                  <div className="text-center py-12 text-xs text-slate-400 font-semibold">
                    No node selected. Click a node in the graph workspace to retrieve metadata.
                  </div>
                )}

                {!detailsLoading && !detailsError && details && (
                  <>
                    {details.type === 'gene' ? (
                      <>
                        {/* Gene Profile Card */}
                        <Card>
                          <CardContent className="pt-4 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-teal-500/10 rounded-md text-teal-600 dark:text-teal-400">
                                <Dna className="h-5 w-5 animate-pulse" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-50 truncate leading-none">
                                  {details.label}
                                </h3>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-1">
                                  {details.id}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-555 dark:text-slate-400 leading-normal border-t border-slate-100 dark:border-slate-800/50 pt-3">
                              {details.description}
                            </p>

                            <div className="border-t border-slate-100 dark:border-slate-800/50 pt-3 text-[11px] space-y-2">
                              <div className="flex justify-between">
                                <span className="text-slate-550 dark:text-slate-400">Entity Type:</span>
                                <Badge variant="gene" className="uppercase text-[9px] font-bold">
                                  gene
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-550 dark:text-slate-400">Vocabulary Schema:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-350">{details.source}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-550 dark:text-slate-400">Ontology Degree:</span>
                                <span className="font-semibold font-mono text-slate-700 dark:text-slate-350">{details.degree} connections</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Genomic Structure Diagram */}
                        <Card>
                          <CardHeader className="pb-1">
                            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Dna className="h-3.5 w-3.5 text-teal-650 dark:text-teal-400" />
                              <span>Genomic Structure</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-2 text-xs">
                            <div className="flex justify-between text-[10px] text-slate-555 dark:text-slate-400 mb-2 font-mono select-none">
                              <span>Locus: {details.label === 'BRCA1' ? 'Chr 17: q21.31' : 'Chr 4: p16.3'}</span>
                              <span>Size: {details.label === 'BRCA1' ? '81.19 kb' : '169.01 kb'}</span>
                            </div>
                            
                            {/* Exon Intron Minimalist SVG Chart */}
                            <svg viewBox="0 0 280 40" className="w-full h-8 overflow-visible mt-2">
                              <line x1="10" y1="20" x2="270" y2="20" stroke="var(--graph-edge)" strokeWidth="2" />
                              <rect x="10" y="14" width="16" height="12" fill="var(--graph-node-disease)" rx="1" className="opacity-60" />
                              <text x="18" y="36" textAnchor="middle" fontSize="6.5" fill="var(--text-secondary)" className="font-mono">5'UTR</text>
                              <rect x="36" y="10" width="30" height="20" fill="var(--graph-node-gene)" rx="2" />
                              <text x="51" y="36" textAnchor="middle" fontSize="6.5" fill="var(--text-secondary)" className="font-mono">E-1</text>
                              <rect x="100" y="10" width="45" height="20" fill="var(--graph-node-gene)" rx="2" />
                              <text x="122" y="36" textAnchor="middle" fontSize="6.5" fill="var(--text-secondary)" className="font-mono">E-2</text>
                              <rect x="185" y="10" width="38" height="20" fill="var(--graph-node-gene)" rx="2" />
                              <text x="204" y="36" textAnchor="middle" fontSize="6.5" fill="var(--text-secondary)" className="font-mono">E-3</text>
                              <rect x="254" y="14" width="16" height="12" fill="var(--graph-node-disease)" rx="1" className="opacity-60" />
                              <text x="262" y="36" textAnchor="middle" fontSize="6.5" fill="var(--text-secondary)" className="font-mono">3'UTR</text>
                            </svg>
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <>
                        {/* Disease Profile Card */}
                        <Card>
                          <CardContent className="pt-4 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-teal-500/10 rounded-md text-teal-600 dark:text-teal-400">
                                <Activity className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-50 truncate leading-none">
                                  {details.label}
                                </h3>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-1">
                                  {details.id}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-555 dark:text-slate-400 leading-normal border-t border-slate-100 dark:border-slate-800/50 pt-3">
                              {details.description}
                            </p>
                          </CardContent>
                        </Card>

                        {/* KG Discovery Evidence Card */}
                        <Card>
                          <CardHeader className="pb-1">
                            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Network className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                              <span>Knowledge Graph Evidence</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-2 text-xs space-y-2.5">
                            <div className="border-b border-slate-100 dark:border-slate-800/50 pb-2 text-[11px] space-y-2">
                              <div className="flex justify-between">
                                <span className="text-slate-550 dark:text-slate-400">Target Gene:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{centerNodeLabel}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-550 dark:text-slate-400">Edge Relation Type:</span>
                                <Badge variant="secondary" className="text-[9px] font-bold font-mono uppercase">
                                  {mock.mockAssociations.find(a => 
                                    (a.gene.toUpperCase() === centerNodeLabel?.toUpperCase() && a.disease.toLowerCase() === details.label.toLowerCase())
                                  )?.predicate.replace('biolink:', '').replace(/_/g, ' ') || 'Associated With'}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-550 dark:text-slate-400">Connection Strength:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                  {mock.mockAssociations.find(a => 
                                    (a.gene.toUpperCase() === centerNodeLabel?.toUpperCase() && a.disease.toLowerCase() === details.label.toLowerCase())
                                  )?.score.toFixed(2) || '0.75'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-550 dark:text-slate-400">Connected Genes in KG:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{details.degree} genes</span>
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2.5 border border-slate-200/50 dark:border-slate-800/50 rounded">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Evidence Summary:</span>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2.5 border border-slate-200/50 dark:border-slate-800/50 rounded">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Evidence Summary:</span>
                              {centerNodeLabel && centerNodeLabel !== details.label
                                ? `Semantic pathways connecting ${centerNodeLabel} to ${details.label} have been resolved in the Monarch Disease Ontology network.`
                                : `${details.label} is directly connected to disease associations in the Monarch Disease Ontology network.`
                              }
                            </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* TAB 2: NEIGHBORHOOD ASSOCIATIONS — sourced from real knowledge graph */}
          <TabsContent value="associations" className="mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={centerNodeLabel ?? 'empty-assoc'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="space-y-5"
              >
                {!centerNodeLabel && (
                  <div className="text-center py-12 text-xs text-slate-400 font-semibold">
                    Search for a gene to see its associations.
                  </div>
                )}

                {centerNodeLabel && loading && !realSubgraph && (
                  <div className="text-center py-8 text-xs text-slate-400 font-semibold space-y-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500 border-t-transparent mx-auto"></div>
                    <div>Loading real graph associations...</div>
                  </div>
                )}

                {centerNodeLabel && !loading && !realSubgraph && (
                  <div className="text-center py-8 text-xs text-slate-400 font-semibold space-y-2">
                    <div>Connecting to BioWeaver backend...</div>
                    <div className="text-[10px] font-normal">Retrying backend connection in background.</div>
                  </div>
                )}

                {centerNodeLabel && realSubgraph && (() => {
                  const directDiseases = realSubgraph.directDiseases;
                  const indirectDiseases = realSubgraph.indirectDiseases;

                  return (
                    <>
                      {/* DIRECT DISEASE ASSOCIATIONS */}
                      <div>
                        <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-teal-500"></span>
                          Direct Disease Associations ({directDiseases.length})
                        </div>
                        {directDiseases.length === 0 ? (
                          <div className="text-[10px] text-slate-400 italic py-2 px-1">No direct disease associations in the knowledge graph.</div>
                        ) : (
                          <Card className="p-0 overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Disease</TableHead>
                                  <TableHead>Relation</TableHead>
                                  <TableHead>Source Gene</TableHead>
                                  <TableHead>Path</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {directDiseases.map((d, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-semibold">
                                      <button
                                        type="button"
                                        onClick={() => onNodeFocus(d.label)}
                                        className="text-slate-700 dark:text-slate-200 hover:underline text-left font-mono cursor-pointer text-[10px]"
                                      >
                                        {d.label}
                                      </button>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="disease" className="font-mono text-[9px] uppercase font-bold bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                                        DIRECT
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-[10px] font-bold text-teal-600 dark:text-teal-400">
                                      {realSubgraph.gene}
                                    </TableCell>
                                    <TableCell className="text-[9px] font-mono text-slate-400">
                                      {realSubgraph.gene} → {d.label}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Card>
                        )}
                      </div>

                      {/* INDIRECT DISEASE ASSOCIATIONS (2-HOP) */}
                      <div>
                        <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
                          Indirect Disease Candidates — 2-Hop ({indirectDiseases.length})
                        </div>
                        {indirectDiseases.length === 0 ? (
                          <div className="text-[10px] text-slate-400 italic py-2 px-1">No indirect disease candidates found.</div>
                        ) : (
                          <Card className="p-0 overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Disease</TableHead>
                                  <TableHead>Relation</TableHead>
                                  <TableHead>Source Gene</TableHead>
                                  <TableHead>Path</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {indirectDiseases.map((d, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-semibold">
                                      <span className="text-slate-700 dark:text-slate-200 font-mono text-[10px]">{d.disease}</span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary" className="font-mono text-[9px] uppercase font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                        INDIRECT
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                      Through {d.through_gene}
                                    </TableCell>
                                    <TableCell className="text-[9px] font-mono text-slate-400 max-w-[120px] truncate" title={d.path.join(' → ')}>
                                      {d.path.join(' → ')}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Card>
                        )}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* TAB 3: AI PREDICTOR */}
          {showPredictTab && (
            <TabsContent value="predict" className="mt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${centerNodeLabel}-${focusedNodeLabel}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-5">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                          <Cpu className="h-4 w-4 text-teal-500" />
                          <span>ML Association Validator</span>
                        </CardTitle>
                        <CardDescription>Predict biological connection probabilities in real-time</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Gene Symbol</span>
                            <div className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold select-none text-slate-800 dark:text-slate-200">
                              {centerNodeLabel}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Selected Disease</span>
                            <div className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold select-none text-slate-800 dark:text-slate-200">
                              {focusedNodeLabel}
                            </div>
                          </div>
                        </div>

                        <div className="text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 font-bold py-1.5 select-none font-mono border-t border-slate-100 dark:border-slate-800/80 pt-3">
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                          <span>ML validation evaluated automatically</span>
                        </div>
                      </CardContent>
                    </Card>

                    {predictError && (
                      <Alert variant="danger">
                        <AlertTitle>Connection Error</AlertTitle>
                        <AlertDescription>
                          Unable to retrieve prediction from the BioWeaver backend.
                        </AlertDescription>
                      </Alert>
                    )}

                    {predictLoading && (
                      <Card className="p-4 space-y-4 animate-pulse">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
                          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
                        </div>
                      </Card>
                    )}

                    {prediction && !predictLoading && (
                      <Card className="p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessment Result</span>
                          {prediction.isAssociated ? (
                            <Badge variant="success" className="h-6 px-2.5 text-[10px] gap-1 font-bold">
                              <CheckCircle2 className="h-3 w-3" /> Associated
                            </Badge>
                          ) : (
                            <Badge variant="danger" className="h-6 px-2.5 text-[10px] gap-1 font-bold">
                              <XCircle className="h-3 w-3" /> Unassociated
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center font-mono">
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md">
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Probability</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-50 mt-0.5 animate-pulse">
                              {(prediction.probability * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md">
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Confidence</div>
                            <div className="text-sm font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                              {prediction.confidence}
                            </div>
                          </div>
                        </div>

                        <div className="text-[10.5px] font-mono text-center text-slate-550 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 border.5 border-slate-200 dark:border-slate-800 rounded-md leading-normal">
                          Predicted association probability: <span className="font-bold text-teal-600 dark:text-teal-400">{(prediction.probability * 100).toFixed(1)}%</span>
                        </div>
                      </Card>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          )}

          {/* TAB 4: PLATFORM STATUS */}
          <TabsContent value="stats" className="mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={statsLoading ? 'loading-stats' : 'loaded-stats'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {statsLoading && (
                  <div className="space-y-5 animate-pulse">
                    <Card className="p-4 space-y-3">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                      </div>
                    </Card>
                    <Card className="p-4 space-y-3">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                      </div>
                    </Card>
                  </div>
                )}

                {statsError && (
                  <Alert variant="danger">
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>
                      Unable to retrieve data from the BioWeaver backend.
                    </AlertDescription>
                  </Alert>
                )}

                {stats && !statsLoading && (
                  <div className="space-y-5 text-xs">
                    {/* Graph Statistics */}
                    <Card>
                      <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Database className="h-4 w-4 text-teal-600" />
                          <span>Graph Network Parameters</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3 text-[11px] space-y-2">
                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-500 dark:text-slate-400">Total Nodes:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{stats.graphStats.totalNodes.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-500 dark:text-slate-400">Total Edges:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{stats.graphStats.totalEdges.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-500 dark:text-slate-400">Unique Genes:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{stats.graphStats.uniqueGenes.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-500 dark:text-slate-400">Unique Diseases:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{stats.graphStats.uniqueDiseases.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">STRING Interactions:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{stats.graphStats.proteinInteractions.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Model Training Statistics */}
                    <Card>
                      <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Cpu className="h-4 w-4 text-teal-600" />
                          <span>Random Forest Validation</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3 text-[11px] space-y-2">
                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-500 dark:text-slate-400">Classifier Accuracy:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{(stats.modelMetrics.accuracy * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="text-slate-500 dark:text-slate-400">Train Split Size:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{stats.graphStats.trainSamples.toLocaleString()} (70%)</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span className="text-slate-500 dark:text-slate-400">Test Split Size:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{stats.graphStats.testSamples.toLocaleString()} (30%)</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Confusion Matrix Table */}
                    <Card className="p-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Confusion Matrix</div>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                        <div />
                        <div className="text-slate-400 uppercase py-0.5">Pred Neg</div>
                        <div className="text-slate-400 uppercase py-0.5">Pred Pos</div>

                        <div className="text-slate-400 uppercase flex items-center justify-center">Act Neg</div>
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">{stats.modelMetrics.confusionMatrix[0][0]}</div>
                        <div className="p-2 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-900/10 rounded text-rose-700 dark:text-rose-400">{stats.modelMetrics.confusionMatrix[0][1]}</div>

                        <div className="text-slate-400 uppercase flex items-center justify-center">Act Pos</div>
                        <div className="p-2 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-900/10 rounded text-amber-700 dark:text-amber-400">{stats.modelMetrics.confusionMatrix[1][0]}</div>
                        <div className="p-2 bg-teal-500/10 dark:bg-teal-500/20 border border-teal-900/10 rounded text-teal-700 dark:text-teal-400">{stats.modelMetrics.confusionMatrix[1][1]}</div>
                      </div>
                    </Card>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
}
