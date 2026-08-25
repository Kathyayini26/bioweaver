export interface TermDetails {
  id: string; // e.g. "HGNC:11621"
  label: string; // e.g. "HNF1A"
  type: 'gene' | 'disease' | 'pathway' | 'protein' | 'chemical' | string;
  description: string;
  source: string;
  degree: number;
  isEmbedded: boolean;
  embeddings: number[]; // 128-dimensional Node2Vec vector
}

export interface SubgraphNode {
  id: string;
  label: string;
  type: 'gene' | 'disease' | 'pathway' | 'protein' | 'chemical' | string;
}

export interface SubgraphEdge {
  source: string;
  target: string;
  predicate: string;
  score: number;
}

export interface SubgraphData {
  center: SubgraphNode;
  nodes: SubgraphNode[];
  edges: SubgraphEdge[];
}

/** Real neighbor entry from the knowledge graph */
export interface RealNeighborEntry {
  id: string;
  label: string;
  type: string;
  relationship: string;
  score: number;
}

/** Real indirect disease entry (2-hop path) */
export interface RealIndirectDisease {
  id: string;
  disease: string;
  through_gene: string;
  score: number;
  ml_score?: number;
  ppi_score?: number;
  path: string[];
  relationship: string;
  is_ml_scored?: boolean;
}

/** Structured real subgraph response from backend /graph/{gene} */
export interface RealSubgraphData {
  gene: string;
  directGenes: RealNeighborEntry[];
  directDiseases: RealNeighborEntry[];
  indirectDiseases: RealIndirectDisease[];
  pathways?: RealNeighborEntry[];
}

export interface PredictionResult {
  geneSymbol: string;
  diseaseName: string;
  isAssociated: boolean;
  probability: number;
  confidence: 'High' | 'Moderate' | 'Low';
}

export interface SystemAnalytics {
  graphStats: {
    totalNodes: number;
    totalEdges: number;
    uniqueGenes: number;
    uniqueDiseases: number;
    proteinInteractions: number;
    trainSamples: number;
    testSamples: number;
  };
  modelMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: number[][];
  };
  sourceDistribution: Array<{ source: string; count: number }>;
  predicateDistribution: Array<{ predicate: string; count: number }>;
}
