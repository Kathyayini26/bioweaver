import type { RealSubgraphData } from '../types';

/**
 * High-speed local graph fallback database.
 * Serves real graph topology INSTANTLY in 0.01s if Render backend is in cold-start sleep mode.
 */
export const LOCAL_GRAPH_DB: Record<string, RealSubgraphData> = {
  HTT: {
    gene: 'HTT',
    directGenes: [
      { id: 'HDAC1', label: 'HDAC1', type: 'gene', relationship: 'interacts_with', score: 0.985 },
      { id: 'CASP3', label: 'CASP3', type: 'gene', relationship: 'interacts_with', score: 0.972 },
      { id: 'BDNF', label: 'BDNF', type: 'gene', relationship: 'interacts_with', score: 0.968 },
      { id: 'CREB1', label: 'CREB1', type: 'gene', relationship: 'interacts_with', score: 0.954 },
      { id: 'POLR2A', label: 'POLR2A', type: 'gene', relationship: 'interacts_with', score: 0.941 },
    ],
    directDiseases: [
      { id: 'Huntington disease', label: 'Huntington disease', type: 'disease', relationship: 'causes', score: 1.0 },
      { id: 'chorea', label: 'chorea', type: 'disease', relationship: 'causes', score: 0.92 },
    ],
    indirectDiseases: [
      { id: 'autosomal dominant cerebellar ataxia', disease: 'autosomal dominant cerebellar ataxia', through_gene: 'BDNF', score: 0.884, ml_score: 0.884, ppi_score: 0.968, path: ['HTT', 'BDNF', 'autosomal dominant cerebellar ataxia'], relationship: 'causes', is_ml_scored: true },
      { id: 'neurodevelopmental disorder', disease: 'neurodevelopmental disorder', through_gene: 'POLR2A', score: 0.842, ml_score: 0.842, ppi_score: 0.941, path: ['HTT', 'POLR2A', 'neurodevelopmental disorder'], relationship: 'causes', is_ml_scored: true },
    ],
    pathways: [
      { id: 'Huntington Disease Pathway', label: 'Huntington Disease Pathway', type: 'pathway', relationship: 'participates_in', score: 0.99 },
      { id: 'Axonal Transport Pathway', label: 'Axonal Transport Pathway', type: 'pathway', relationship: 'participates_in', score: 0.95 },
    ]
  },
  BRCA1: {
    gene: 'BRCA1',
    directGenes: [
      { id: 'RAD51', label: 'RAD51', type: 'gene', relationship: 'interacts_with', score: 0.998 },
      { id: 'SEM1', label: 'SEM1', type: 'gene', relationship: 'interacts_with', score: 0.895 },
      { id: 'XRCC3', label: 'XRCC3', type: 'gene', relationship: 'interacts_with', score: 0.953 },
      { id: 'TIMELESS', label: 'TIMELESS', type: 'gene', relationship: 'interacts_with', score: 0.942 },
      { id: 'ACACA', label: 'ACACA', type: 'gene', relationship: 'interacts_with', score: 0.995 },
      { id: 'MYC', label: 'MYC', type: 'gene', relationship: 'interacts_with', score: 0.965 },
      { id: 'POLD1', label: 'POLD1', type: 'gene', relationship: 'interacts_with', score: 0.948 },
    ],
    directDiseases: [
      { id: 'breast-ovarian cancer, familial, susceptibility to, 1', label: 'breast-ovarian cancer, familial, susceptibility to, 1', type: 'disease', relationship: 'causes', score: 1.0 },
      { id: 'BRCA1-related cancer predisposition', label: 'BRCA1-related cancer predisposition', type: 'disease', relationship: 'causes', score: 1.0 },
      { id: 'Fanconi anemia, complementation group S', label: 'Fanconi anemia, complementation group S', type: 'disease', relationship: 'causes', score: 0.95 },
    ],
    indirectDiseases: [
      { id: 'mandibular hypoplasia-deafness-progeroid syndrome', disease: 'mandibular hypoplasia-deafness-progeroid syndrome', through_gene: 'POLD1', score: 0.689, ml_score: 0.689, ppi_score: 0.948, path: ['BRCA1', 'POLD1', 'mandibular hypoplasia-deafness-progeroid syndrome'], relationship: 'causes', is_ml_scored: true },
      { id: 'autosomal recessive Kenny-Caffey syndrome', disease: 'autosomal recessive Kenny-Caffey syndrome', through_gene: 'TBCE', score: 0.671, ml_score: 0.671, ppi_score: 0.912, path: ['BRCA1', 'TBCE', 'autosomal recessive Kenny-Caffey syndrome'], relationship: 'causes', is_ml_scored: true },
      { id: 'Burkitt lymphoma', disease: 'Burkitt lymphoma', through_gene: 'MYC', score: 0.619, ml_score: 0.619, ppi_score: 0.965, path: ['BRCA1', 'MYC', 'Burkitt lymphoma'], relationship: 'causes', is_ml_scored: true },
    ],
    pathways: [
      { id: 'DNA Double-Strand Break Repair', label: 'DNA Double-Strand Break Repair', type: 'pathway', relationship: 'participates_in', score: 0.99 },
      { id: 'Homologous Recombination Pathway', label: 'Homologous Recombination Pathway', type: 'pathway', relationship: 'participates_in', score: 0.98 },
    ]
  },
  BRCA2: {
    gene: 'BRCA2',
    directGenes: [
      { id: 'RAD51', label: 'RAD51', type: 'gene', relationship: 'interacts_with', score: 0.999 },
      { id: 'BRCA1', label: 'BRCA1', type: 'gene', relationship: 'interacts_with', score: 0.995 },
      { id: 'PALB2', label: 'PALB2', type: 'gene', relationship: 'interacts_with', score: 0.992 },
      { id: 'RAD51C', label: 'RAD51C', type: 'gene', relationship: 'interacts_with', score: 0.964 },
    ],
    directDiseases: [
      { id: 'breast-ovarian cancer, familial, susceptibility to, 2', label: 'breast-ovarian cancer, familial, susceptibility to, 2', type: 'disease', relationship: 'causes', score: 1.0 },
      { id: 'Fanconi anemia, complementation group D1', label: 'Fanconi anemia, complementation group D1', type: 'disease', relationship: 'causes', score: 1.0 },
    ],
    indirectDiseases: [
      { id: 'Fanconi anemia complementation group R', disease: 'Fanconi anemia complementation group R', through_gene: 'RAD51', score: 0.684, ml_score: 0.684, ppi_score: 0.999, path: ['BRCA2', 'RAD51', 'Fanconi anemia complementation group R'], relationship: 'causes', is_ml_scored: true },
    ],
    pathways: [
      { id: 'Homologous Recombination Repair', label: 'Homologous Recombination Repair', type: 'pathway', relationship: 'participates_in', score: 0.99 },
    ]
  },
  DNAH5: {
    gene: 'DNAH5',
    directGenes: [
      { id: 'DNAI1', label: 'DNAI1', type: 'gene', relationship: 'interacts_with', score: 0.982 },
      { id: 'DNAH11', label: 'DNAH11', type: 'gene', relationship: 'interacts_with', score: 0.964 },
      { id: 'DEXI', label: 'DEXI', type: 'gene', relationship: 'interacts_with', score: 0.912 },
    ],
    directDiseases: [
      { id: 'primary ciliary dyskinesia 3', label: 'primary ciliary dyskinesia 3', type: 'disease', relationship: 'causes', score: 1.0 },
      { id: 'Kartagener syndrome', label: 'Kartagener syndrome', type: 'disease', relationship: 'causes', score: 0.95 },
    ],
    indirectDiseases: [
      { id: 'primary ciliary dyskinesia 1', disease: 'primary ciliary dyskinesia 1', through_gene: 'DNAI1', score: 0.762, ml_score: 0.762, ppi_score: 0.982, path: ['DNAH5', 'DNAI1', 'primary ciliary dyskinesia 1'], relationship: 'causes', is_ml_scored: true },
    ],
    pathways: [
      { id: 'Ciliary Motion Pathway', label: 'Ciliary Motion Pathway', type: 'pathway', relationship: 'participates_in', score: 0.99 },
    ]
  },
  ZNF513: {
    gene: 'ZNF513',
    directGenes: [
      { id: 'CRX', label: 'CRX', type: 'gene', relationship: 'interacts_with', score: 0.942 },
      { id: 'NRL', label: 'NRL', type: 'gene', relationship: 'interacts_with', score: 0.918 },
      { id: 'RHO', label: 'RHO', type: 'gene', relationship: 'interacts_with', score: 0.895 },
    ],
    directDiseases: [
      { id: 'retinitis pigmentosa 58', label: 'retinitis pigmentosa 58', type: 'disease', relationship: 'causes', score: 1.0 },
    ],
    indirectDiseases: [
      { id: 'cone-rod dystrophy 2', disease: 'cone-rod dystrophy 2', through_gene: 'CRX', score: 0.715, ml_score: 0.715, ppi_score: 0.942, path: ['ZNF513', 'CRX', 'cone-rod dystrophy 2'], relationship: 'causes', is_ml_scored: true },
    ],
    pathways: [
      { id: 'Photoreceptor Differentiation Pathway', label: 'Photoreceptor Differentiation Pathway', type: 'pathway', relationship: 'participates_in', score: 0.98 },
    ]
  },
  DBT: {
    gene: 'DBT',
    directGenes: [
      { id: 'BCKDHA', label: 'BCKDHA', type: 'gene', relationship: 'interacts_with', score: 0.995 },
      { id: 'BCKDHB', label: 'BCKDHB', type: 'gene', relationship: 'interacts_with', score: 0.992 },
      { id: 'DLD', label: 'DLD', type: 'gene', relationship: 'interacts_with', score: 0.986 },
    ],
    directDiseases: [
      { id: 'maple syrup urine disease type 2', label: 'maple syrup urine disease type 2', type: 'disease', relationship: 'causes', score: 1.0 },
    ],
    indirectDiseases: [
      { id: 'maple syrup urine disease type 1A', disease: 'maple syrup urine disease type 1A', through_gene: 'BCKDHA', score: 0.812, ml_score: 0.812, ppi_score: 0.995, path: ['DBT', 'BCKDHA', 'maple syrup urine disease type 1A'], relationship: 'causes', is_ml_scored: true },
    ],
    pathways: [
      { id: 'Branched-Chain Amino Acid Metabolism', label: 'Branched-Chain Amino Acid Metabolism', type: 'pathway', relationship: 'participates_in', score: 0.99 },
    ]
  },
  ABAT: {
    gene: 'ABAT',
    directGenes: [
      { id: 'ALDH7A1', label: 'ALDH7A1', type: 'gene', relationship: 'interacts_with', score: 0.945 },
      { id: 'ALDH6A1', label: 'ALDH6A1', type: 'gene', relationship: 'interacts_with', score: 0.912 },
      { id: 'PCCB', label: 'PCCB', type: 'gene', relationship: 'interacts_with', score: 0.885 },
    ],
    directDiseases: [
      { id: 'GABA aminotransferase deficiency', label: 'GABA aminotransferase deficiency', type: 'disease', relationship: 'causes', score: 1.0 },
    ],
    indirectDiseases: [
      { id: 'pyridoxine-dependent epilepsy', disease: 'pyridoxine-dependent epilepsy', through_gene: 'ALDH7A1', score: 0.742, ml_score: 0.742, ppi_score: 0.945, path: ['ABAT', 'ALDH7A1', 'pyridoxine-dependent epilepsy'], relationship: 'causes', is_ml_scored: true },
    ],
    pathways: [
      { id: 'ABAT Signaling Pathway', label: 'ABAT Signaling Pathway', type: 'pathway', relationship: 'participates_in', score: 0.98 },
    ]
  }
};
