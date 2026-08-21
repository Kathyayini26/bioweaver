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

// Production & Dev API URL configuration with automatic production URL correction
const getBackendUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL as string)?.trim();
  
  // Correct any typo in VITE_API_URL that has bioweaver-backend.onrender.com instead of bioweaver.onrender.com
  if (envUrl && envUrl.includes('bioweaver-backend.onrender.com')) {
    return 'https://bioweaver.onrender.com';
  }
  
  if (envUrl && envUrl !== 'http://localhost:8000') {
    return envUrl.replace(/\/$/, '');
  }
  
  // If running on Vercel or any non-localhost domain, automatically use live Render backend
  if (
    typeof window !== 'undefined' && 
    !window.location.hostname.includes('localhost') && 
    !window.location.hostname.includes('127.0.0.1')
  ) {
    return 'https://bioweaver.onrender.com';
  }
  
  return 'http://localhost:8000';
};

const BACKEND = getBackendUrl();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─────────────────────────────────────────────────────────────
// Convert backend RealSubgraphData → SubgraphData for the
// D3 canvas, keeping ONLY direct neighbors in the visual graph.
// Indirect diseases stay in the Associations panel only.
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
// Fetch real subgraph from backend with automatic retry (wakes up Render automatically)
// ─────────────────────────────────────────────────────────────
let _realCache: Map<string, RealSubgraphData> = new Map();

export const getRealSubgraph = async (gene: string, retries = 4): Promise<RealSubgraphData | null> => {
  const key = gene.toUpperCase();
  if (_realCache.has(key)) return _realCache.get(key)!;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`${BACKEND}/graph/${encodeURIComponent(gene)}`);
      if (res.ok) {
        const data: RealSubgraphData = await res.json();
        _realCache.set(key, data);
        return data;
      }
      console.warn(`Backend /graph/${gene} returned status ${res.status} on attempt ${attempt + 1}`);
    } catch (err) {
      console.warn(`Backend connection attempt ${attempt + 1}/${retries} failed for /graph/${gene}:`, err);
    }

    // If attempt failed, wait 3.5 seconds before retrying to allow Render cold-start to finish
    if (attempt < retries - 1) {
      await delay(3500);
    }
  }

  return null;
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
    const directGeneCount = real.directGenes.filter(g => g.score >= minScore).length;
    const directDiseaseCount = real.directDiseases.length;
    const indirectCount = real.indirectDiseases.length;
    console.group(`[BioWeaver] Gene: ${real.gene}`);
    console.log(`  Direct neighbors: ${directGeneCount + directDiseaseCount}`);
    console.log(`  Direct genes: ${directGeneCount}`);
    console.log(`  Direct diseases: ${directDiseaseCount}`);
    console.log(`  Valid 2-hop disease candidates: ${indirectCount}`);
    real.indirectDiseases.slice(0, 5).forEach(d => {
      console.log(`  ${d.path.join(' -> ')}`);
    });
    console.groupEnd();

    return realToSubgraph(real, minScore);
  }
  console.warn(`No backend data for ${centerLabel} — backend may not be running.`);
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
// predictAssociation — calls FastAPI with automatic retry
// ─────────────────────────────────────────────────────────────
export const predictAssociation = async (gene: string, disease: string, retries = 3): Promise<PredictionResult> => {
  for (let attempt = 0; attempt < retries; attempt++) {
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
    } catch (err) {
      if (attempt < retries - 1) {
        await delay(2000);
      }
    }
  }

  console.warn('FastAPI prediction endpoint unavailable, falling back to mock classifier.');
  await delay(450);
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
// getGenesList / getDiseasesList with automatic retry
// ─────────────────────────────────────────────────────────────
export const getGenesList = async (retries = 3): Promise<string[]> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`${BACKEND}/genes`);
      if (res.ok) {
        const data = await res.json();
        return data.genes ?? [];
      }
    } catch (_) {
      if (attempt < retries - 1) {
        await delay(2500);
      }
    }
  }
  return mock.mockGenes;
};

export const getDiseasesList = async (): Promise<string[]> => {
  await delay(100);
  return mock.mockDiseases;
};

// Re-export types for convenience
export type { RealSubgraphData, RealNeighborEntry, RealIndirectDisease };
