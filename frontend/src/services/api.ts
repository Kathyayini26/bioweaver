import type { SystemAnalytics, TermDetails, SubgraphData, PredictionResult } from '../types';
import * as mock from './mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getSystemAnalytics = async (): Promise<SystemAnalytics> => {
  await delay(200);
  return mock.mockAnalytics;
};

export const getTermDetails = async (label: string): Promise<TermDetails | null> => {
  await delay(250);
  return mock.getMockTermDetails(label);
};

export const getLocalSubgraph = async (centerLabel: string, minScore: number): Promise<SubgraphData | null> => {
  await delay(300);
  return mock.getMockLocalSubgraph(centerLabel, minScore);
};

export const predictAssociation = async (gene: string, disease: string): Promise<PredictionResult> => {
  await delay(450);
  return mock.predictMockAssociation(gene, disease);
};

export const getGenesList = async (): Promise<string[]> => {
  await delay(100);
  return mock.mockGenes;
};

export const getDiseasesList = async (): Promise<string[]> => {
  await delay(100);
  return mock.mockDiseases;
};
