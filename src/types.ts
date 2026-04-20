export type Page = 'home' | 'specs' | 'selection' | 'detect' | 'evolution';
export type Modality = 'photo' | 'video' | 'text' | 'audio';

export interface AnalysisMetric {
  label: string;
  value: number;
}

export interface DetectionResult {
  id?: number;
  type: Modality;
  generation_source: 'HUMAN' | 'AI';
  score: number;
  justification: string;
  confidence: number;
  breakdown?: AnalysisMetric[];
}

export interface SystemStats {
  totalAttempts: number;
  averageAccuracy: number;
  learningProgress: number;
  intelligenceStatus: string;
  neuralVersion: string;
}

export interface HistoryItem {
  id: number;
  modality: Modality;
  source: 'HUMAN' | 'AI';
  score: number;
  confidence: number;
  justification: string;
  timestamp: string;
}
