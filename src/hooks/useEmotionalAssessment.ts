import { useState, useCallback, useRef } from 'react';
import { type EmotionAnalysis } from '../services/emotionService';

interface AssessmentTrigger {
  type: 'initial' | 'crisis' | 'persistent';
  emotionAnalysis: EmotionAnalysis;
  timestamp: Date;
}

interface UseEmotionalAssessmentReturn {
  shouldShowAssessment: boolean;
  assessmentType: 'initial' | 'crisis' | 'persistent' | null;
  currentAssessment: EmotionAnalysis | null;
  triggerAssessment: (emotionAnalysis: EmotionAnalysis) => void;
  dismissAssessment: () => void;
  resetAssessmentHistory: () => void;
}

export function useEmotionalAssessment(): UseEmotionalAssessmentReturn {
  const [shouldShowAssessment, setShouldShowAssessment] = useState(false);
  const [assessmentType, setAssessmentType] = useState<'initial' | 'crisis' | 'persistent' | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<EmotionAnalysis | null>(null);
  
  // Track assessment history
  const assessmentHistoryRef = useRef<AssessmentTrigger[]>([]);
  const lastAssessmentTimeRef = useRef<Date | null>(null);
  const messageCountRef = useRef(0);
  const hasShownInitialRef = useRef(false);

  const triggerAssessment = useCallback((emotionAnalysis: EmotionAnalysis) => {
    const now = new Date();
    messageCountRef.current += 1;
    
    // Don't show assessments too frequently (minimum 2 minutes apart)
    if (lastAssessmentTimeRef.current && 
        now.getTime() - lastAssessmentTimeRef.current.getTime() < 120000) {
      return;
    }

    const { mental_health_indicators, primary_emotion } = emotionAnalysis;
    
    // Crisis detection - immediate trigger
    const isCrisis = 
      mental_health_indicators.anxiety_level > 0.8 ||
      mental_health_indicators.depression_level > 0.8 ||
      (mental_health_indicators.anxiety_level > 0.6 && mental_health_indicators.depression_level > 0.6) ||
      ['hopeless', 'suicidal', 'desperate'].includes(primary_emotion);

    if (isCrisis) {
      setAssessmentType('crisis');
      setCurrentAssessment(emotionAnalysis);
      setShouldShowAssessment(true);
      lastAssessmentTimeRef.current = now;
      assessmentHistoryRef.current.push({
        type: 'crisis',
        emotionAnalysis,
        timestamp: now
      });
      return;
    }

    // Initial assessment - show after first message with significant emotional content
    if (!hasShownInitialRef.current && messageCountRef.current >= 1) {
      const hasSignificantEmotion = 
        mental_health_indicators.anxiety_level > 0.4 ||
        mental_health_indicators.depression_level > 0.4 ||
        mental_health_indicators.stress_level > 0.4 ||
        emotionAnalysis.confidence > 0.6;

      if (hasSignificantEmotion) {
        hasShownInitialRef.current = true;
        setAssessmentType('initial');
        setCurrentAssessment(emotionAnalysis);
        setShouldShowAssessment(true);
        lastAssessmentTimeRef.current = now;
        assessmentHistoryRef.current.push({
          type: 'initial',
          emotionAnalysis,
          timestamp: now
        });
        return;
      }
    }

    // Persistent pattern detection - check last 3 assessments over 10+ minutes
    if (messageCountRef.current >= 5) {
      const recentAssessments = assessmentHistoryRef.current
        .filter(a => now.getTime() - a.timestamp.getTime() < 600000) // Last 10 minutes
        .slice(-3);

      if (recentAssessments.length >= 3) {
        const avgAnxiety = recentAssessments.reduce((sum, a) => 
          sum + a.emotionAnalysis.mental_health_indicators.anxiety_level, 0) / recentAssessments.length;
        
        const avgDepression = recentAssessments.reduce((sum, a) => 
          sum + a.emotionAnalysis.mental_health_indicators.depression_level, 0) / recentAssessments.length;

        const avgStress = recentAssessments.reduce((sum, a) => 
          sum + a.emotionAnalysis.mental_health_indicators.stress_level, 0) / recentAssessments.length;

        // Persistent moderate levels across multiple messages
        const isPersistent = 
          (avgAnxiety > 0.5 && avgAnxiety < 0.8) ||
          (avgDepression > 0.5 && avgDepression < 0.8) ||
          (avgStress > 0.6);

        if (isPersistent) {
          setAssessmentType('persistent');
          setCurrentAssessment(emotionAnalysis);
          setShouldShowAssessment(true);
          lastAssessmentTimeRef.current = now;
          assessmentHistoryRef.current.push({
            type: 'persistent',
            emotionAnalysis,
            timestamp: now
          });
          return;
        }
      }
    }

    // Store assessment for pattern tracking (even if not showing modal)
    assessmentHistoryRef.current.push({
      type: 'initial',
      emotionAnalysis,
      timestamp: now
    });

    // Keep only last 10 assessments to prevent memory issues
    if (assessmentHistoryRef.current.length > 10) {
      assessmentHistoryRef.current = assessmentHistoryRef.current.slice(-10);
    }
  }, []);

  const dismissAssessment = useCallback(() => {
    setShouldShowAssessment(false);
    setAssessmentType(null);
    setCurrentAssessment(null);
  }, []);

  const resetAssessmentHistory = useCallback(() => {
    assessmentHistoryRef.current = [];
    lastAssessmentTimeRef.current = null;
    messageCountRef.current = 0;
    hasShownInitialRef.current = false;
    setShouldShowAssessment(false);
    setAssessmentType(null);
    setCurrentAssessment(null);
  }, []);

  return {
    shouldShowAssessment,
    assessmentType,
    currentAssessment,
    triggerAssessment,
    dismissAssessment,
    resetAssessmentHistory
  };
}