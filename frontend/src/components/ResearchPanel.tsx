import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { Button } from './ui/button';
import { Select } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getTermDetails, 
  getSystemAnalytics, 
  predictAssociation,
  getGenesList,
  getDiseasesList
} from '../services/api';
import * as mock from '../services/mockData';
import type { TermDetails, SystemAnalytics, PredictionResult } from '../types';
import { 
  Dna, 
  Activity, 
  Database, 
  HelpCircle, 
  Cpu, 
  CheckCircle2, 
  XCircle,
  Network
} from 'lucide-react';

interface ResearchPanelProps {
  selectedNodeLabel: string;
  onNodeFocus: (nodeLabel: string) => void;
}

export function ResearchPanel({ selectedNodeLabel, onNodeFocus }: ResearchPanelProps) {
  // Details state
  const [details, setDetails] = useState<TermDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(false);

  // Stats state
  const [stats, setStats] = useState<SystemAnalytics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  // Predictor state
  const [targetList, setTargetList] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState(false);

  // Associations sorting state
  const [assocSortField, setAssocSortField] = useState<'neighbor' | 'score'>('score');
  const [assocSortAsc, setAssocSortAsc] = useState<boolean>(false);

  // Fetch Term Details when selected node changes
  useEffect(() => {
    if (!selectedNodeLabel) return;
    setDetailsLoading(true);
    setDetailsError(false);
    setPrediction(null); // clear old predictions

    getTermDetails(selectedNodeLabel)
      .then(res => {
        setDetails(res);
        setDetailsLoading(false);
      })
      .catch(() => {
        setDetailsError(true);
        setDetailsLoading(false);
      });
  }, [selectedNodeLabel]);

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

  // Fetch target list for predictor dropdown depending on selected type (cross-entity matching)
  useEffect(() => {
    if (!details) return;
    setSelectedTarget('');
    setPrediction(null);

    const loadTargets = async () => {
      try {
        if (details.type === 'gene') {
          // Select from diseases
          const dList = await getDiseasesList();
          setTargetList(dList);
          if (dList.length > 0) setSelectedTarget(dList[0]);
        } else {
          // Select from genes
          const gList = await getGenesList();
          setTargetList(gList);
          if (gList.length > 0) setSelectedTarget(gList[0]);
        }
      } catch {
        setPredictError(true);
      }
    };

    loadTargets();
  }, [details]);

  // Run AI Predictor
  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details || !selectedTarget) return;

    setPredictLoading(true);
    setPredictError(false);
    setPrediction(null);

    // Endpoint: POST /predict (geneSymbol, diseaseName)
    const gene = details.type === 'gene' ? details.label : selectedTarget;
    const disease = details.type === 'disease' ? details.label : selectedTarget;

    predictAssociation(gene, disease)
      .then(res => {
        setPrediction(res);
        setPredictLoading(false);
      })
      .catch(() => {
        setPredictError(true);
        setPredictLoading(false);
      });
  };

  return (
    <div className="w-[30%] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden shrink-0 transition-colors duration-300">
      <Tabs defaultValue="details" className="flex flex-col h-full overflow-hidden">
        {/* Tab Selection Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-2 bg-slate-55 dark:bg-slate-900/40 shrink-0 transition-colors duration-300">
          <TabsList className="w-full justify-start gap-1 bg-slate-100 dark:bg-slate-800 p-1">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="associations">Associations</TabsTrigger>
            <TabsTrigger value="predict">Predict</TabsTrigger>
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
                    {/* Node Summary Card */}
                    <Card>
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-teal-500/10 rounded-md text-teal-600 dark:text-teal-400">
                            {details.type === 'gene' ? (
                              <Dna className="h-5 w-5 animate-pulse" />
                            ) : (
                              <Activity className="h-5 w-5" />
                            )}
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

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal border-t border-slate-100 dark:border-slate-800/50 pt-3">
                          {details.description}
                        </p>

                        <div className="border-t border-slate-100 dark:border-slate-800/50 pt-3 text-[11px] space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Entity Type:</span>
                            <Badge variant={details.type === 'gene' ? 'gene' : 'disease'} className="uppercase text-[9px] font-bold">
                              {details.type}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Vocabulary Schema:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{details.source}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Ontology Degree:</span>
                            <span className="font-semibold font-mono text-slate-700 dark:text-slate-300">{details.degree} connections</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Embedding Sync:</span>
                            <span className="font-semibold text-teal-650 dark:text-teal-400 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                              128-dim Vector Ready
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Minimalist Genomic Structure Diagram */}
                    {details.type === 'gene' && (
                      <Card>
                        <CardHeader className="pb-1">
                          <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Dna className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                            <span>Genomic Structure</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2 text-xs">
                          <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-2 font-mono select-none">
                            <span>Locus: {details.label === 'BRCA1' ? 'Chr 17: q21.31' : 'Chr 4: p16.3'}</span>
                            <span>Size: {details.label === 'BRCA1' ? '81.19 kb' : '169.01 kb'}</span>
                          </div>
                          
                          {/* Exon Intron Minimalist SVG Chart */}
                          <svg viewBox="0 0 280 40" className="w-full h-8 overflow-visible mt-2">
                            {/* Intron Line */}
                            <line x1="10" y1="20" x2="270" y2="20" stroke="var(--graph-edge)" strokeWidth="2" />
                            
                            {/* Exons and UTRs */}
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
                    )}

                    {/* Node2Vec sparkline vector */}
                    <Card>
                      <CardHeader className="pb-1">
                        <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Network className="h-3.5 w-3.5 text-teal-600" />
                          <span>Node2Vec Embedding Fingerprint</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="grid-cols-16 gap-0.5 my-2">
                          {details.embeddings.slice(0, 64).map((val, idx) => (
                            <div
                              key={idx}
                              className="aspect-square border border-slate-200/20 dark:border-slate-800 relative group cursor-crosshair"
                              style={{
                                backgroundColor: `rgba(13, 148, 136, ${val})`
                              }}
                            >
                              <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-1 z-30 bg-slate-900 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow-md whitespace-nowrap">
                                Dim {idx}: {val.toFixed(4)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium">
                          <span>Dim 0</span>
                          <span className="flex items-center gap-1">
                            <HelpCircle className="h-3 w-3" /> Hover cells to view float weights
                          </span>
                          <span>Dim 63</span>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* TAB 2: NEIGHBORHOOD ASSOCIATIONS */}
          <TabsContent value="associations" className="mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={detailsLoading ? 'loading-assoc' : (details ? details.id : 'empty-assoc')}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="space-y-4"
              >
                {detailsLoading && (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                    <Card className="p-4 space-y-3">
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    </Card>
                  </div>
                )}

                {!detailsLoading && !details && (
                  <div className="text-center py-12 text-xs text-slate-400 font-semibold">
                    No node selected. Click a node to inspect associations.
                  </div>
                )}

                {!detailsLoading && details && (
                  <>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Neighbors of {details.label} ({details.degree} connected nodes)
                    </div>

                    <Card className="p-0 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <button
                                type="button"
                                onClick={() => {
                                  if (assocSortField === 'neighbor') {
                                    setAssocSortAsc(!assocSortAsc);
                                  } else {
                                    setAssocSortField('neighbor');
                                    setAssocSortAsc(true);
                                  }
                                }}
                                className="font-bold flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                                title="Sort by neighbor name"
                              >
                                Neighbor {assocSortField === 'neighbor' && (assocSortAsc ? '▲' : '▼')}
                              </button>
                            </TableHead>
                            <TableHead>Predicate</TableHead>
                            <TableHead className="text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  if (assocSortField === 'score') {
                                    setAssocSortAsc(!assocSortAsc);
                                  } else {
                                    setAssocSortField('score');
                                    setAssocSortAsc(false);
                                  }
                                }}
                                className="font-bold flex items-center justify-end gap-1 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer ml-auto"
                                title="Sort by association score"
                              >
                                Score {assocSortField === 'score' && (assocSortAsc ? '▲' : '▼')}
                              </button>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mock.mockAssociations
                            .filter((a: any) => a.gene.toUpperCase() === details.label.toUpperCase() || a.disease.toLowerCase() === details.label.toLowerCase())
                            .map((assoc: any) => {
                              const neighborLabel = assoc.gene.toUpperCase() === details.label.toUpperCase() ? assoc.disease : assoc.gene;
                              return {
                                assoc,
                                neighborLabel,
                                predicate: assoc.predicate,
                                score: assoc.score
                              };
                            })
                            .sort((a, b) => {
                              let aVal = assocSortField === 'neighbor' ? a.neighborLabel : a.score;
                              let bVal = assocSortField === 'neighbor' ? b.neighborLabel : b.score;
                              if (typeof aVal === 'string' && typeof bVal === 'string') {
                                return assocSortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                              } else {
                                return assocSortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
                              }
                            })
                            .map(({ assoc, neighborLabel }, idx: number) => {
                              return (
                                <TableRow key={idx}>
                                  <TableCell className="font-semibold">
                                    <button
                                      type="button"
                                      onClick={() => onNodeFocus(neighborLabel)}
                                      className="text-teal-600 dark:text-teal-400 hover:underline text-left font-mono cursor-pointer font-bold"
                                      title={`Inspect ${neighborLabel}`}
                                    >
                                      {neighborLabel}
                                    </button>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className="font-mono text-[9px] uppercase">
                                      {assoc.predicate.replace('biolink:', '')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-mono font-semibold">
                                    {assoc.score.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </Card>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* TAB 3: AI PREDICTOR */}
          <TabsContent value="predict" className="mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={details ? details.id : 'empty-pred'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {!details ? (
                  <div className="text-center py-12 text-xs text-slate-400 font-semibold">
                    No active node selected. Center on a node to evaluate pairwise predictions.
                  </div>
                ) : (
                  <div className="space-y-5">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                          <Cpu className="h-4 w-4 text-teal-500" />
                          <span>Classifier Pairwise Evaluator</span>
                        </CardTitle>
                        <CardDescription>Evaluate candidate associations in real-time</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <form onSubmit={handlePredict} className="space-y-4">
                          {/* Prepopulated Node */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Source Term</label>
                            <div className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-55 dark:bg-slate-900 font-mono text-xs font-semibold select-none transition-colors duration-300">
                              {details.label} <span className="text-[10px] text-slate-400">({details.type})</span>
                            </div>
                          </div>

                          {/* Dropdown for Cross Entity Node */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Target {details.type === 'gene' ? 'Disease' : 'Gene'}
                            </label>
                            <Select
                              value={selectedTarget}
                              onChange={(e) => setSelectedTarget(e.target.value)}
                              options={targetList.map(t => ({ value: t, label: t }))}
                            />
                          </div>

                          <Button type="submit" className="w-full h-8 text-xs cursor-pointer" disabled={predictLoading || !selectedTarget}>
                            {predictLoading ? 'Computing Decision Trees...' : 'Predict Association'}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {predictError && (
                      <Alert variant="danger">
                        <AlertTitle>Connection Error</AlertTitle>
                        <AlertDescription>
                          Unable to retrieve data from the BioWeaver backend.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Predict Skeleton */}
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

                    {/* Prediction Result Display */}
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

                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md transition-colors duration-300">
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Probability</div>
                            <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-50 mt-0.5">
                              {(prediction.probability * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md transition-colors duration-300">
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Confidence</div>
                            <div className="text-sm font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                              {prediction.confidence}
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

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
    </div>
  );
}
