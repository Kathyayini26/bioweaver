import type { SystemAnalytics, TermDetails, SubgraphData, SubgraphNode, SubgraphEdge, PredictionResult } from '../types';

export const mockAnalytics: SystemAnalytics = {
  graphStats: {
    totalNodes: 18597,
    totalEdges: 107187,
    uniqueGenes: 6688,
    uniqueDiseases: 11909,
    proteinInteractions: 100554,
    trainSamples: 10612,
    testSamples: 2654
  },
  modelMetrics: {
    accuracy: 0.8719,
    precision: 0.8730,
    recall: 0.8704,
    f1Score: 0.8717,
    confusionMatrix: [
      [1159, 168],
      [172, 1155]
    ]
  },
  sourceDistribution: [
    { source: 'infores:omim', count: 4820 },
    { source: 'infores:clingen', count: 1841 },
    { source: 'infores:ctd', count: 300 }
  ],
  predicateDistribution: [
    { predicate: 'biolink:causes', count: 5410 },
    { predicate: 'biolink:associated_with_increased_likelihood_of', count: 1220 },
    { predicate: 'biolink:gene_associated_with_disease', count: 331 }
  ]
};

const generateMockEmbedding = (seed: string): number[] => {
  const vec: number[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  for (let i = 0; i < 128; i++) {
    h = (h * 1664525 + 1013904223) | 0;
    vec.push((h % 1000) / 1000.0);
  }
  const len = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return vec.map(val => val / (len || 1));
};

export const mockGenes = [
  'HNF1A', 'MYL2', 'PMS2', 'RRAS2', 'SCN3A', 'NR2F2', 'ITPR2', 'PDCD1',
  'RPGRIP1L', 'SIPA1L3', 'FBLN5', 'DMXL2', 'THOC1', 'TMTC4', 'SLC26A5',
  'GUF1', 'BRCA1', 'BRCA2', 'CFTR', 'HTT', 'TP53', 'APOE', 'EGFR', 'MTHFR'
];

export const mockDiseases = [
  'monogenic diabetes',
  'hypertrophic cardiomyopathy',
  'Lynch syndrome 4',
  'Noonan syndrome',
  'RASopathy',
  'genetic developmental and epileptic encephalopathy',
  '46,xx sex reversal 5',
  'isolated anhidrosis with normal sweat glands',
  'autoimmune disease with susceptibility to mycobacterium tuberculosis',
  'COACH syndrome 3',
  'cataract 45',
  'cutis laxa, autosomal dominant 2',
  'hearing loss, autosomal dominant 71',
  'hearing loss, autosomal dominant 86',
  'hearing loss, autosomal recessive 122',
  'autosomal recessive nonsyndromic hearing loss 61',
  'developmental and epileptic encephalopathy, 40',
  'breast cancer',
  'ovarian cancer',
  'Fanconi anemia',
  'pancreatic cancer',
  'prostate cancer',
  'medulloblastoma',
  'cystic fibrosis',
  'Huntington disease',
  'Alzheimer disease',
  'colorectal cancer'
];

export const mockAssociations: Array<{
  gene: string;
  geneId: string;
  disease: string;
  diseaseId: string;
  predicate: string;
  source: string;
  score: number;
  novelty: number;
}> = [
  { gene: 'HNF1A', geneId: 'HGNC:11621', disease: 'monogenic diabetes', diseaseId: 'MONDO:0015967', predicate: 'biolink:causes', source: 'infores:clingen', score: 0.94, novelty: 0.12 },
  { gene: 'MYL2', geneId: 'HGNC:7583', disease: 'hypertrophic cardiomyopathy', diseaseId: 'MONDO:0005045', predicate: 'biolink:associated_with_increased_likelihood_of', source: 'infores:clingen', score: 0.89, novelty: 0.22 },
  { gene: 'PMS2', geneId: 'HGNC:9122', disease: 'Lynch syndrome 4', diseaseId: 'MONDO:0013699', predicate: 'biolink:causes', source: 'infores:clingen', score: 0.92, novelty: 0.18 },
  { gene: 'RRAS2', geneId: 'HGNC:17271', disease: 'Noonan syndrome', diseaseId: 'MONDO:0018997', predicate: 'biolink:causes', source: 'infores:clingen', score: 0.85, novelty: 0.35 },
  { gene: 'RRAS2', geneId: 'HGNC:17271', disease: 'RASopathy', diseaseId: 'MONDO:0021060', predicate: 'biolink:causes', source: 'infores:clingen', score: 0.88, novelty: 0.29 },
  { gene: 'SCN3A', geneId: 'HGNC:10590', disease: 'genetic developmental and epileptic encephalopathy', diseaseId: 'MONDO:0100062', predicate: 'biolink:causes', source: 'infores:clingen', score: 0.91, novelty: 0.15 },
  { gene: 'NR2F2', geneId: 'HGNC:7976', disease: '46,xx sex reversal 5', diseaseId: 'MONDO:0030049', predicate: 'biolink:causes', source: 'infores:omim', score: 0.78, novelty: 0.45 },
  { gene: 'ITPR2', geneId: 'HGNC:6181', disease: 'isolated anhidrosis with normal sweat glands', diseaseId: 'MONDO:0007118', predicate: 'biolink:causes', source: 'infores:omim', score: 0.81, novelty: 0.52 },
  { gene: 'PDCD1', geneId: 'HGNC:8760', disease: 'autoimmune disease with susceptibility to mycobacterium tuberculosis', diseaseId: 'MONDO:0975847', predicate: 'biolink:causes', source: 'infores:omim', score: 0.74, novelty: 0.61 },
  { gene: 'RPGRIP1L', geneId: 'HGNC:29168', disease: 'COACH syndrome 3', diseaseId: 'MONDO:0030862', predicate: 'biolink:causes', source: 'infores:omim', score: 0.84, novelty: 0.33 },
  { gene: 'SIPA1L3', geneId: 'HGNC:23801', disease: 'cataract 45', diseaseId: 'MONDO:0014799', predicate: 'biolink:causes', source: 'infores:omim', score: 0.82, novelty: 0.41 },
  { gene: 'FBLN5', geneId: 'HGNC:3602', disease: 'cutis laxa, autosomal dominant 2', diseaseId: 'MONDO:0013751', predicate: 'biolink:causes', source: 'infores:omim', score: 0.86, novelty: 0.25 },
  { gene: 'DMXL2', geneId: 'HGNC:2938', disease: 'hearing loss, autosomal dominant 71', diseaseId: 'MONDO:0033258', predicate: 'biolink:causes', source: 'infores:omim', score: 0.79, novelty: 0.48 },
  { gene: 'THOC1', geneId: 'HGNC:19070', disease: 'hearing loss, autosomal dominant 86', diseaseId: 'MONDO:0859524', predicate: 'biolink:causes', source: 'infores:omim', score: 0.76, novelty: 0.55 },
  { gene: 'TMTC4', geneId: 'HGNC:25904', disease: 'hearing loss, autosomal recessive 122', diseaseId: 'MONDO:0958228', predicate: 'biolink:causes', source: 'infores:omim', score: 0.80, novelty: 0.38 },
  { gene: 'SLC26A5', geneId: 'HGNC:9359', disease: 'autosomal recessive nonsyndromic hearing loss 61', diseaseId: 'MONDO:0013471', predicate: 'biolink:causes', source: 'infores:omim', score: 0.85, novelty: 0.28 },
  { gene: 'GUF1', geneId: 'HGNC:25799', disease: 'developmental and epileptic encephalopathy, 40', diseaseId: 'MONDO:0014895', predicate: 'biolink:causes', source: 'infores:omim', score: 0.83, novelty: 0.34 },
  
  // BRCA1 enriched mock database mappings
  { gene: 'BRCA1', geneId: 'HGNC:1100', disease: 'breast cancer', diseaseId: 'MONDO:0008903', predicate: 'biolink:associated_with_increased_likelihood_of', source: 'infores:clingen', score: 0.98, novelty: 0.05 },
  { gene: 'BRCA1', geneId: 'HGNC:1100', disease: 'ovarian cancer', diseaseId: 'MONDO:0008135', predicate: 'biolink:associated_with_increased_likelihood_of', source: 'infores:clingen', score: 0.94, novelty: 0.15 },
  { gene: 'BRCA1', geneId: 'HGNC:1100', disease: 'Fanconi anemia', diseaseId: 'MONDO:0019391', predicate: 'biolink:causes', source: 'infores:omim', score: 0.88, novelty: 0.28 },
  { gene: 'BRCA1', geneId: 'HGNC:1100', disease: 'pancreatic cancer', diseaseId: 'MONDO:0006256', predicate: 'biolink:associated_with_increased_likelihood_of', source: 'infores:ctd', score: 0.82, novelty: 0.45 },
  { gene: 'BRCA1', geneId: 'HGNC:1100', disease: 'prostate cancer', diseaseId: 'MONDO:0008316', predicate: 'biolink:associated_with_increased_likelihood_of', source: 'infores:ctd', score: 0.76, novelty: 0.52 },
  { gene: 'BRCA1', geneId: 'HGNC:1100', disease: 'medulloblastoma', diseaseId: 'MONDO:0016484', predicate: 'biolink:associated_with_increased_likelihood_of', source: 'infores:omim', score: 0.71, novelty: 0.65 },

  { gene: 'BRCA2', geneId: 'HGNC:1101', disease: 'breast cancer', diseaseId: 'MONDO:0008903', predicate: 'biolink:associated_with_increased_likelihood_of', source: 'infores:clingen', score: 0.97, novelty: 0.08 },
  { gene: 'TP53', geneId: 'HGNC:11998', disease: 'breast cancer', diseaseId: 'MONDO:0008903', predicate: 'biolink:associated_with_increased_likelihood_of', source: 'infores:clingen', score: 0.95, novelty: 0.10 },
  { gene: 'EGFR', geneId: 'HGNC:3236', disease: 'breast cancer', diseaseId: 'MONDO:0008903', predicate: 'biolink:associated_with_increased_likelihood_of', source: 'infores:ctd', score: 0.72, novelty: 0.31 }
];

export const getMockTermDetails = (label: string): TermDetails | null => {
  const cleanLabel = label.trim();
  const symbol = cleanLabel.toUpperCase();
  
  // A gene symbol: all caps, no spaces, short (≤ 15 chars), not a disease string
  // Examples: BRCA1, BARD1, RAD51, MYC, TP53
  // Diseases have lowercase/spaces: "breast cancer", "Fanconi anemia..."
  const looksLikeGene = /^[A-Z0-9\-]+$/.test(cleanLabel) && cleanLabel.length <= 15;
  
  let type = 'disease';
  let id = `MONDO:MOCK_${symbol.replace(/\s+/g, '_')}`;
  let description = `Pathology class ${cleanLabel}. Mapped in Monarch disease ontology hierarchies.`;
  let source = 'infores:mondo';
  
  if (looksLikeGene || mockGenes.includes(symbol)) {
    type = 'gene';
    id = `HGNC:MOCK_${symbol}`;
    description = `Homo sapiens gene ${symbol}. Mapped to high-dimensional representation vector utilizing graph walk pathways.`;
    source = 'infores:hgnc';
  } else if (cleanLabel.toLowerCase().includes('pathway')) {
    type = 'pathway';
    id = `REACT:MOCK_${symbol.replace(/\s+/g, '_')}`;
    description = `Biological pathway ${cleanLabel}. Enriched via Reactome database annotations.`;
    source = 'infores:reactome';
  } else if (cleanLabel.toLowerCase().includes('protein')) {
    type = 'protein';
    id = `UNIPROT:MOCK_${symbol.replace(/\s+/g, '_')}`;
    description = `Functional protein element ${cleanLabel}. Resolved from UniProt repository.`;
    source = 'infores:uniprot';
  }
  
  return {
    id,
    label: type === 'gene' ? symbol : cleanLabel,
    type,
    description,
    source,
    degree: 5,
    isEmbedded: true,
    embeddings: generateMockEmbedding(cleanLabel)
  };
};

export const getMockLocalSubgraph = (centerNodeLabel: string, minScore: number): SubgraphData | null => {
  const details = getMockTermDetails(centerNodeLabel);
  if (!details) return null;

  const centerNode: SubgraphNode = {
    id: details.label,
    label: details.label,
    type: details.type
  };

  const adjNodes: SubgraphNode[] = [];
  const adjEdges: SubgraphEdge[] = [];
  const visitedNodeIds = new Set<string>([centerNode.id]);
  const symbol = centerNodeLabel.trim().toUpperCase();

  const customNeighbors: Record<string, Array<{ id: string; label: string; type: string; predicate: string; score: number }>> = {
    HTT: [
      { id: 'Huntington disease', label: 'Huntington disease', type: 'disease', predicate: 'biolink:causes', score: 0.92 },
      { id: 'MYL2', label: 'MYL2', type: 'gene', predicate: 'protein-interaction', score: 0.81 },
      { id: 'HNF1A', label: 'HNF1A', type: 'gene', predicate: 'protein-interaction', score: 0.77 },
      { id: 'Apoptosis Pathway', label: 'Apoptosis Pathway', type: 'pathway', predicate: 'biolink:participates_in', score: 0.88 },
      { id: 'HTT-associated protein', label: 'HTT-associated protein', type: 'protein', predicate: 'protein-interaction', score: 0.74 }
    ],
    BRCA1: [
      { id: 'breast cancer', label: 'breast cancer', type: 'disease', predicate: 'biolink:associated_with_increased_likelihood_of', score: 0.98 },
      { id: 'ovarian cancer', label: 'ovarian cancer', type: 'disease', predicate: 'biolink:associated_with_increased_likelihood_of', score: 0.94 },
      { id: 'Fanconi anemia', label: 'Fanconi anemia', type: 'disease', predicate: 'biolink:causes', score: 0.88 },
      { id: 'BARD1', label: 'BARD1', type: 'gene', predicate: 'protein-interaction', score: 0.91 },
      { id: 'BRCA2', label: 'BRCA2', type: 'gene', predicate: 'protein-interaction', score: 0.85 },
      { id: 'DNA Repair Pathway', label: 'DNA Repair Pathway', type: 'pathway', predicate: 'biolink:participates_in', score: 0.95 }
    ],
    BRCA2: [
      { id: 'breast cancer', label: 'breast cancer', type: 'disease', predicate: 'biolink:associated_with_increased_likelihood_of', score: 0.97 },
      { id: 'ovarian cancer', label: 'ovarian cancer', type: 'disease', predicate: 'biolink:associated_with_increased_likelihood_of', score: 0.90 },
      { id: 'BRCA1', label: 'BRCA1', type: 'gene', predicate: 'protein-interaction', score: 0.85 },
      { id: 'RAD51', label: 'RAD51', type: 'gene', predicate: 'protein-interaction', score: 0.88 },
      { id: 'Homologous Recombination Pathway', label: 'Homologous Recombination Pathway', type: 'pathway', predicate: 'biolink:participates_in', score: 0.93 }
    ],
    TP53: [
      { id: 'breast cancer', label: 'breast cancer', type: 'disease', predicate: 'biolink:associated_with_increased_likelihood_of', score: 0.95 },
      { id: 'Li-Fraumeni syndrome', label: 'Li-Fraumeni syndrome', type: 'disease', predicate: 'biolink:causes', score: 0.99 },
      { id: 'MDM2', label: 'MDM2', type: 'gene', predicate: 'protein-interaction', score: 0.92 },
      { id: 'p53 Pathway', label: 'p53 Pathway', type: 'pathway', predicate: 'biolink:participates_in', score: 0.97 }
    ]
  };

  if (details.type === 'gene') {
    const list = customNeighbors[symbol];
    if (list) {
      list.forEach(item => {
        if (item.score >= minScore) {
          if (!visitedNodeIds.has(item.id)) {
            visitedNodeIds.add(item.id);
            adjNodes.push({ id: item.id, label: item.label, type: item.type });
          }
          adjEdges.push({
            source: symbol,
            target: item.label,
            predicate: item.predicate,
            score: item.score
          });
        }
      });
    } else {
      // Dynamic fallback for other genes
      const matches = mockAssociations.filter(
        a => a.gene.toUpperCase() === symbol && a.score >= minScore
      );
      matches.forEach(m => {
        if (!visitedNodeIds.has(m.disease)) {
          visitedNodeIds.add(m.disease);
          adjNodes.push({ id: m.disease, label: m.disease, type: 'disease' });
        }
        adjEdges.push({
          source: symbol,
          target: m.disease,
          predicate: m.predicate,
          score: m.score
        });
      });

      // PPI fallback
      const otherGenes = mockGenes.filter(g => g !== symbol).slice(0, 2);
      otherGenes.forEach((g, i) => {
        const score = 0.85 - i * 0.05;
        if (score >= minScore) {
          if (!visitedNodeIds.has(g)) {
            visitedNodeIds.add(g);
            adjNodes.push({ id: g, label: g, type: 'gene' });
          }
          adjEdges.push({
            source: symbol,
            target: g,
            predicate: 'protein-interaction',
            score
          });
        }
      });

      // Pathway fallback
      const mockPathwayName = `${symbol} metabolic pathway`;
      if (0.80 >= minScore) {
        if (!visitedNodeIds.has(mockPathwayName)) {
          visitedNodeIds.add(mockPathwayName);
          adjNodes.push({ id: mockPathwayName, label: mockPathwayName, type: 'pathway' });
        }
        adjEdges.push({
          source: symbol,
          target: mockPathwayName,
          predicate: 'biolink:participates_in',
          score: 0.80
        });
      }
    }
  } else {
    // Disease center node
    const matches = mockAssociations.filter(
      a => a.disease.toLowerCase() === details.label.toLowerCase() && a.score >= minScore
    );
    matches.forEach(m => {
      if (!visitedNodeIds.has(m.gene)) {
        visitedNodeIds.add(m.gene);
        adjNodes.push({ id: m.gene, label: m.gene, type: 'gene' });
      }
      adjEdges.push({
        source: m.gene,
        target: details.label,
        predicate: m.predicate,
        score: m.score
      });
    });

    // Scan custom mappings for reverse-connects
    Object.keys(customNeighbors).forEach(gene => {
      customNeighbors[gene].forEach(item => {
        if (item.id.toLowerCase() === details.label.toLowerCase() && item.score >= minScore) {
          if (!visitedNodeIds.has(gene)) {
            visitedNodeIds.add(gene);
            adjNodes.push({ id: gene, label: gene, type: 'gene' });
          }
          adjEdges.push({
            source: gene,
            target: details.label,
            predicate: item.predicate,
            score: item.score
          });
        }
      });
    });
  }

  return {
    center: centerNode,
    nodes: [centerNode, ...adjNodes],
    edges: adjEdges
  };
};

export const predictMockAssociation = (geneSymbol: string, diseaseName: string): PredictionResult => {
  const gSym = geneSymbol.trim().toUpperCase();
  const dName = diseaseName.trim();

  const gEmb = generateMockEmbedding(gSym);
  const dEmb = generateMockEmbedding(dName);

  let dot = 0;
  for (let i = 0; i < 128; i++) {
    dot += gEmb[i] * dEmb[i];
  }

  const probability = Math.min(0.99, Math.max(0.01, 0.4 + dot * 0.5));
  const isAssociated = probability >= 0.5;

  const distance = Math.abs(probability - 0.5);
  let confidence: 'High' | 'Moderate' | 'Low' = 'Low';
  if (distance > 0.20) confidence = 'High';
  else if (distance > 0.08) confidence = 'Moderate';

  return {
    geneSymbol: gSym,
    diseaseName: dName,
    isAssociated,
    probability,
    confidence
  };
};
