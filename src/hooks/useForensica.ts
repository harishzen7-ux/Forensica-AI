import React, { useEffect, useState } from 'react';
import { DetectionResult, HistoryItem, Modality, Page, SystemStats } from '../types';
import { clearHistory, detectContent, getHistory, getSystemStats, submitFeedback } from '../services/detectionService';

export function useForensica() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedModality, setSelectedModality] = useState<Modality | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    void fetchStats();
    void fetchHistoryData();
    void checkBackendConnection();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getSystemStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchHistoryData = async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const checkBackendConnection = async () => {
    try {
      await getSystemStats();
      setBackendConnected(true);
    } catch (error) {
      setBackendConnected(false);
    }
  };

  const navigate = (page: Page, modality: Modality | null = null) => {
    setCurrentPage(page);
    if (modality) {
      setSelectedModality(modality);
    }
    setResult(null);
    setFile(null);
    setPreviewUrl(null);
    setTextInput('');
    setFeedbackSubmitted(false);
    setAnalysisError(null);
    void fetchStats();
    void fetchHistoryData();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setAnalysisError(null);

    if (selectedFile) {
      const sizeInMB = selectedFile.size / (1024 * 1024);
      let limit = 0;

      if (selectedModality === 'photo') {
        limit = 50;
      }
      if (selectedModality === 'video') {
        limit = 500;
      }
      if (selectedModality === 'audio') {
        limit = 50;
      }

      if (sizeInMB > limit) {
        setAnalysisError(`File exceeds ${limit}MB limit. Please compress the file or choose a smaller one.`);
        event.target.value = '';
        return;
      }
    }

    setFile(selectedFile);
    if (selectedFile && selectedModality === 'photo') {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedModality) {
      return;
    }

    const content = selectedModality === 'text' ? textInput : file;
    if (!content) {
      return;
    }

    if (selectedModality === 'text') {
      const wordCount = textInput.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 1000) {
        setAnalysisError('Text exceeds 1000 words limit. Please shorten your input.');
        return;
      }
    } else if (file) {
      const sizeInMB = file.size / (1024 * 1024);
      if (selectedModality === 'photo' && sizeInMB > 50) {
        setAnalysisError('Photo exceeds 50MB limit.');
        return;
      }
      if (selectedModality === 'video' && sizeInMB > 500) {
        setAnalysisError('Video exceeds 500MB limit.');
        return;
      }
      if (selectedModality === 'audio' && sizeInMB > 50) {
        setAnalysisError('Audio exceeds 50MB limit.');
        return;
      }
    }

    setIsAnalyzing(true);
    setFeedbackSubmitted(false);
    setAnalysisError(null);

    try {
      const detectedResult = await detectContent(selectedModality, content);

      setTimeout(() => {
        setResult(detectedResult);
        setIsAnalyzing(false);
        void fetchStats();
        void fetchHistoryData();
      }, 1200);
    } catch (error: any) {
      console.error('Detection failed:', error);
      setIsAnalyzing(false);

      let userMessage = 'Analysis failed due to a system error.';
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        userMessage = 'Network connection issue. Please check that the local backend is running and try again.';
      } else if (error.message?.includes('No content provided')) {
        userMessage = 'Please upload a file or enter text before starting analysis.';
      } else if (error.message?.includes('modality')) {
        userMessage = 'Please choose a supported analysis type and try again.';
      } else if (error.message) {
        userMessage = error.message;
      }

      setAnalysisError(userMessage);
    }
  };

  const handleFeedback = async (rating: number, isCorrect: boolean) => {
    if (!result?.id) {
      return;
    }

    try {
      await submitFeedback(result.id, rating, isCorrect);
      setFeedbackSubmitted(true);
      void fetchStats();
      void fetchHistoryData();
    } catch (error) {
      console.error('Feedback failed:', error);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      void fetchStats();
      void fetchHistoryData();
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setFile(null);
    setTextInput('');
    setPreviewUrl(null);
    setFeedbackSubmitted(false);
    setAnalysisError(null);
  };

  return {
    currentPage,
    selectedModality,
    result,
    isAnalyzing,
    file,
    previewUrl,
    textInput,
    stats,
    history,
    feedbackSubmitted,
    analysisError,
    backendConnected,
    navigate,
    handleFileChange,
    handleAnalyze,
    handleFeedback,
    handleClearHistory,
    resetAnalysis,
    setFile,
    setPreviewUrl,
    setTextInput,
  };
}
