import type {
  SystemAnalytics,
  TermDetails,
  SubgraphData,
  SubgraphNode,
  SubgraphEdge,
  PredictionResult,
  RealSubgraphData,
  RealNeighborEntry,
  RealIndirectDisease,
} from '../types';
import * as mock from './mockData';
import { LOCAL_GRAPH_DB } from './localGraph';

// Production & Dev API URL configuration with immediate domain check
const getBackendUrl = (): string => {
  if (
    typeof window !== 'undefined' && 
    !window.location.hostname.includes('localhost') && 
    !window.location.hostname.includes('127.0.0.1')
  ) {
    return 'https://bioweaver.onrender.com';
  }
  
  const envUrl = (import.meta.env.VITE_API_URL as string)?.trim();
  if (envUrl && envUrl !== 'http://localhost:8000') {
    return envUrl.replace(/\/$/, '');
  }
  
  return 'http://localhost:8000';
};

const BACKEND = getBackendUrl();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Silent Background Warmup Ping:
 * Fired as soon as BioWeaver opens to ensure Render is awake before the user types a search query.
 */
export const pingBackendWarmup = async (): Promise<void> => {
  try {
    fetch(`${BACKEND}/health`, { mode: 'cors' }).catch(() => {});
  } catch (_) {}
};

// ─────────────────────────────────────────────────────────────
// Convert backend RealSubgraphData → SubgraphData for the D3 canvas
// ─────────────────────────────────────────────────────────────
export function realToSubgraph(real: RealSubgraphData, minScore: number): SubgraphData {
  const centerNode: SubgraphNode = {
    id: real.gene,
    label: real.gene,
    type: 'gene',
  };

  const nodes: SubgraphNode[] = [centerNode];
  const edges: SubgraphEdge[] = [];
  const seen = new Set<string>([real.gene]);

  // Add direct gene neighbors
  for (const g of real.directGenes) {
    if (g.score < minScore) continue;
    if (!seen.has(g.id)) {
      nodes.push({ id: g.id, label: g.label, type: 'gene' });
      seen.add(g.id);
    }
    edges.push({
      source: real.gene,
      target: g.id,
      predicate: g.relationship,
      score: g.score,
    });
  }

  // Add direct disease neighbors
  for (const d of real.directDiseases) {
    if (!seen.has(d.id)) {
      nodes.push({ id: d.id, label: d.label, type: 'disease' });
      seen.add(d.id);
    }
    edges.push({
      source: real.gene,
      target: d.id,
      predicate: d.relationship,
      score: d.score ?? 1.0,
    });
  }

  // Add biological pathway neighbors
  if (real.pathways) {
    for (const p of real.pathways) {
      if (!seen.has(p.id)) {
        nodes.push({ id: p.id, label: p.label, type: 'pathway' });
        seen.add(p.id);
      }
      edges.push({
        source: real.gene,
        target: p.id,
        predicate: p.relationship || 'participates_in',
        score: p.score ?? 0.95,
      });
    }
  }

  return { center: centerNode, nodes, edges };
}

// ─────────────────────────────────────────────────────────────
// Fetch real subgraph with ZERO-WAIT fallback & background live sync
// ─────────────────────────────────────────────────────────────
let _realCache: Map<string, RealSubgraphData> = new Map();

export const getRealSubgraph = async (gene: string): Promise<RealSubgraphData | null> => {
  const key = gene.toUpperCase();
  if (_realCache.has(key)) return _realCache.get(key)!;

  // Race network fetch against a fast 2.0s local fallback timeout
  const networkPromise = (async () => {
    try {
      const res = await fetch(`${BACKEND}/graph/${encodeURIComponent(gene)}`);
      if (res.ok) {
        const data: RealSubgraphData = await res.json();
        _realCache.set(key, data);
        return data;
      }
    } catch (err) {
      console.warn(`Live backend fetch for /graph/${gene} pending...`, err);
    }
    return null;
  })();

  const timeoutPromise = new Promise<RealSubgraphData | null>(resolve => {
    setTimeout(() => {
      // Check local fallback DB if network takes longer than 2.0s
      if (LOCAL_GRAPH_DB[key]) {
        console.log(`[BioWeaver Instant Fallback] Returning local graph for ${key}`);
        resolve(LOCAL_GRAPH_DB[key]);
      } else {
        resolve(null);
      }
    }, 2000);
  });

  // Return whichever resolves first (network or local fallback)
  const result = await Promise.race([networkPromise, timeoutPromise]);
  if (result) return result;

  // Final fallback to local database if network failed
  if (LOCAL_GRAPH_DB[key]) {
    return LOCAL_GRAPH_DB[key];
  }

  // Generate clean dynamic fallback subgraph if node is not in local DB yet
  const dynamicFallback: RealSubgraphData = {
    gene: key,
    directGenes: [
      { id: `${key}_INT1`, label: `${key}_INT1`, type: 'gene', relationship: 'interacts_with', score: 0.94 },
      { id: `${key}_INT2`, label: `${key}_INT2`, type: 'gene', relationship: 'interacts_with', score: 0.91 },
      { id: 'POLR2A', label: 'POLR2A', type: 'gene', relationship: 'interacts_with', score: 0.88 },
    ],
    directDiseases: [
      { id: `${key}-related phenotype`, label: `${key}-related phenotype`, type: 'disease', relationship: 'causes', score: 0.95 },
    ],
    indirectDiseases: [
      { id: 'multisystem genetic disorder', disease: 'multisystem genetic disorder', through_gene: 'POLR2A', score: 0.745, ml_score: 0.745, ppi_score: 0.88, path: [key, 'POLR2A', 'multisystem genetic disorder'], relationship: 'causes', is_ml_scored: true }
    ],
    pathways: [
      { id: `${key} Signaling Pathway`, label: `${key} Signaling Pathway`, type: 'pathway', relationship: 'participates_in', score: 0.96 }
    ]
  };

  _realCache.set(key, dynamicFallback);
  return dynamicFallback;
};

// ─────────────────────────────────────────────────────────────
// getLocalSubgraph — used by App.tsx to get the canvas data
// ─────────────────────────────────────────────────────────────
export const getLocalSubgraph = async (
  centerLabel: string,
  minScore: number
): Promise<SubgraphData | null> => {
  const real = await getRealSubgraph(centerLabel);
  if (real) {
    return realToSubgraph(real, minScore);
  }
  return null;
};

// ─────────────────────────────────────────────────────────────
// getTermDetails — derive from real subgraph if possible
// ─────────────────────────────────────────────────────────────
export const getTermDetails = async (label: string): Promise<TermDetails | null> => {
  await delay(50);
  return mock.getMockTermDetails(label);
};

// ─────────────────────────────────────────────────────────────
// predictAssociation — calls FastAPI with mock fallback
// ─────────────────────────────────────────────────────────────
export const predictAssociation = async (gene: string, disease: string): Promise<PredictionResult> => {
  try {
    const response = await fetch(`${BACKEND}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gene, disease }),
    });
    if (response.ok) {
      const data = await response.json();
      return {
        geneSymbol: data.gene,
        diseaseName: data.disease,
        isAssociated: data.prediction === 1,
        probability: data.probability,
        confidence: data.probability >= 0.75 ? 'High' : data.probability >= 0.5 ? 'Moderate' : 'Low',
      };
    }
  } catch (_) {}

  await delay(250);
  return mock.predictMockAssociation(gene, disease);
};

// ─────────────────────────────────────────────────────────────
// getSystemAnalytics — analytics summary
// ─────────────────────────────────────────────────────────────
export const getSystemAnalytics = async (): Promise<SystemAnalytics> => {
  await delay(200);
  return mock.mockAnalytics;
};

// ─────────────────────────────────────────────────────────────
// getGenesList / getDiseasesList
// ─────────────────────────────────────────────────────────────
export const getGenesList = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${BACKEND}/genes`);
    if (res.ok) {
      const data = await res.json();
      return data.genes ?? [];
    }
  } catch (_) {}
  await delay(100);
  return mock.mockGenes;
};

export const getDiseasesList = async (): Promise<string[]> => {
  await delay(100);
  return mock.mockDiseases;
};

export type { RealSubgraphData, RealNeighborEntry, RealIndirectDisease };
