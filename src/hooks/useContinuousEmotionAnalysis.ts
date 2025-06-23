import { useState, useCallback, useRef, useEffect } from 'react';
import { continuousEmotionService, type ComprehensiveEmotionalAssessment } from '../services/continuousEmotionService';
import { useAuthStore } from '../store/authStore';

interface UseContinuousEmotionAnalysisReturn {
  currentAssessment: ComprehensiveEmotionalAssessment | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzeMessage: (message: string, responseDelay?: number) => Promise<ComprehensiveEmotionalAssessment>;
  getEmotionalHistory: () => any;
  resetAnalysis: () => void;
  exportData: () => any;
}

export function useContinuousEmotionAnalysis(): UseContinuousEmotionAnalysisReturn {
  const [currentAssessment, setCurrentAssessment] = useState<ComprehensiveEmotionalAssessment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const lastMessageTimeRef = useRef<Date | null>(null);

  const analyzeMessage = useCallback(async (message: string, responseDelay?: number): Promise<ComprehensiveEmotionalAssessment> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const now = new Date();
      
      // Calculate response delay if not provided
      let calculatedDelay = responseDelay;
      if (!calculatedDelay && lastMessageTimeRef.current) {
        calculatedDelay = now.getTime() - lastMessageTimeRef.current.getTime();
      }

      // Perform comprehensive analysis
      const assessment = await continuousEmotionService.analyzeEmotionalContext(
        user.id,
        message,
        now,
        calculatedDelay
      );

      setCurrentAssessment(assessment);
      lastMessageTimeRef.current = now;

      return assessment;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user?.id]);

  const getEmotionalHistory = useCallback(() => {
    if (!user?.id) return null;
    return continuousEmotionService.getEmotionalHistory(user.id);
  }, [user?.id]);

  const resetAnalysis = useCallback(() => {
    if (!user?.id) return;
    continuousEmotionService.resetUserContext(user.id);
    setCurrentAssessment(null);
    setError(null);
    lastMessageTimeRef.current = null;
  }, [user?.id]);

  const exportData = useCallback(() => {
    if (!user?.id) return null;
    return continuousEmotionService.exportUserData(user.id);
  }, [user?.id]);

  // Reset on user change
  useEffect(() => {
    if (user?.id) {
      lastMessageTimeRef.current = new Date();
    }
  }, [user?.id]);

  return {
    currentAssessment,
    isAnalyzing,
    error,
    analyzeMessage,
    getEmotionalHistory,
    resetAnalysis,
    exportData
  };
}