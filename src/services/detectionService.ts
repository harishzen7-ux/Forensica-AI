import { DetectionResult, HistoryItem, Modality, SystemStats } from '../types';

const configuredBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '');
const API_BASE_CANDIDATES = configuredBase
  ? [`${configuredBase}/api/v1`]
  : ['http://127.0.0.1:8000/api/v1', 'http://localhost:8000/api/v1'];

const toApiUrl = (base: string, path: string): string => `${base}${path}`;

const apiFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  let lastError: unknown = null;

  for (const base of API_BASE_CANDIDATES) {
    try {
      return await fetch(toApiUrl(base, path), init);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Network request failed');
};

const normalizeClassification = (classification?: string): 'HUMAN' | 'AI' => {
  const value = (classification || '').toLowerCase();
  return value.includes('ai') ? 'AI' : 'HUMAN';
};

const buildScore = (source: 'HUMAN' | 'AI', confidence: number): number => {
  const raw = source === 'HUMAN' ? confidence * 100 : (1 - confidence) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
};

export const detectContent = async (modality: Modality, content: File | string): Promise<DetectionResult> => {
  const formData = new FormData();
  
  // Notice: The FastAPI backend expects 'file' for files, or 'text_content' for text.
  if (typeof content === 'string') {
    formData.append('text_content', content);
  } else {
    formData.append('file', content);
  }

  // 1. Upload and create the pending analysis task
  const uploadResponse = await apiFetch('/upload/', {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || errorData.error || `Upload failed (${uploadResponse.status})`);
  }

  const analysisTask = await uploadResponse.json();
  const analysisId = analysisTask.id;

  // 2. Poll the analysis result until it's completed or failed
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const pollInterval = setInterval(async () => {
      try {
        const checkResponse = await apiFetch(`/analysis/${analysisId}`);
        if (!checkResponse.ok) {
          clearInterval(pollInterval);
          reject(new Error('Failed to fetch analysis status'));
          return;
        }

        const result = await checkResponse.json();
        
        if (result.status === 'completed') {
          clearInterval(pollInterval);
          const generationSource = normalizeClassification(result.classification);
          const confidence = typeof result.confidence === 'number' ? result.confidence : 0;
          // Map to frontend DetectionResult format
          resolve({
            id: result.id,
            type: modality,
            generation_source: generationSource,
            confidence,
            score: buildScore(generationSource, confidence),
            justification: result.explanation || 'Analysis completed.',
          } as DetectionResult);
        } else if (result.status === 'failed') {
          clearInterval(pollInterval);
          reject(new Error(result.explanation || 'Analysis failed on the server.'));
        } else if (Date.now() - startedAt > 120000) {
          clearInterval(pollInterval);
          reject(new Error('Analysis timed out. Please try again.'));
        }
        // If 'pending' or 'processing', we just wait for the next tick
      } catch (e) {
        clearInterval(pollInterval);
        reject(new Error('Polling failed'));
      }
    }, 1500); // Poll every 1.5 seconds
  });
};

export const submitFeedback = async (analysisId: number, rating: number, isCorrect: boolean): Promise<void> => {
  const response = await apiFetch('/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, rating, isCorrect }),
  });

  if (!response.ok) {
    throw new Error('Feedback submission failed');
  }
};

export const getSystemStats = async (): Promise<SystemStats> => {
  const response = await apiFetch('/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  return response.json();
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  const response = await apiFetch('/history');
  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }
  return response.json();
};

export const clearHistory = async (): Promise<void> => {
  const response = await apiFetch('/history/clear', { method: 'POST' });
  if (!response.ok) {
    throw new Error('Failed to clear history');
  }
};
