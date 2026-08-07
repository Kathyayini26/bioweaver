export interface TermDetails {
  id: string; // e.g. "HGNC:11621"
  label: string; // e.g. "HNF1A"
  type: 'gene' | 'disease';
  description: string;
  source: string;
  degree: number;
  isEmbedded: boolean;
  embeddings: number[]; // 128-dimensional Node2Vec vector
}

export interface SubgraphNode {
  id: string;
  label: string;
  type: 'gene' | 'disease';
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
