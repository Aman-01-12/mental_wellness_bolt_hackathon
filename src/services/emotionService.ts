interface EmotionResult {
  label: string;
  score: number;
}

interface EmotionAnalysis {
  primary_emotion: string;
  confidence: number;
  all_emotions: EmotionResult[];
  mental_health_indicators: {
    anxiety_level: number;
    depression_level: number;
    stress_level: number;
    positive_sentiment: number;
  };
  context_analysis?: {
    tone: string;
    intensity: number;
    emotional_complexity: number;
    underlying_themes: string[];
  };
}

class EmotionService {
  private supabaseUrl: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!this.supabaseUrl) {
      throw new Error('Supabase URL is not configured');
    }
  }

  async analyzeEmotion(text: string): Promise<EmotionAnalysis> {
    console.log('🧠 Starting Qwen emotion analysis via edge function...');
    console.log('📝 Analyzing text:', text.substring(0, 50) + '...');
    
    try {
      // Call the Supabase Edge Function that handles Qwen API
      const response = await fetch(`${this.supabaseUrl}/functions/v1/qwen-emotion-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Edge function error:', response.status, errorData);
        throw new Error(`Edge function error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        console.error('❌ Invalid response from edge function:', result);
        throw new Error(`Invalid response: ${result.error || 'No data returned'}`);
      }

      console.log('✅ Qwen emotion analysis complete:', result.data);
      return result.data;

    } catch (error) {
      console.error('❌ Error in emotion analysis:', error);
      throw new Error(`Emotion analysis failed: ${error.message}`);
    }
  }

  // Get emotion color for UI display
  getEmotionColor(emotion: string): string {
    const colorMap: Record<string, string> = {
      'sad': 'text-blue-600',
      'anxious': 'text-yellow-600',
      'angry': 'text-red-600',
      'happy': 'text-green-600',
      'grateful': 'text-purple-600',
      'confused': 'text-orange-600',
      'positive': 'text-emerald-600',
      'neutral': 'text-gray-600',
      'hopeless': 'text-red-700',
      'loving': 'text-pink-600',
      'proud': 'text-indigo-600',
      'excited': 'text-yellow-500',
      'overwhelmed': 'text-red-500',
      'depressed': 'text-blue-700',
      'frustrated': 'text-orange-600',
      'worried': 'text-yellow-700',
      'content': 'text-green-500',
      'peaceful': 'text-blue-400',
      'energetic': 'text-orange-500'
    };
    
    return colorMap[emotion] || 'text-gray-600';
  }

  // Get emotion emoji for UI display
  getEmotionEmoji(emotion: string): string {
    const emojiMap: Record<string, string> = {
      'sad': '😢',
      'anxious': '😰',
      'angry': '😠',
      'happy': '😊',
      'grateful': '🙏',
      'confused': '😕',
      'positive': '✨',
      'neutral': '😐',
      'loving': '💕',
      'hopeful': '🌟',
      'proud': '😌',
      'relieved': '😌',
      'hopeless': '😞',
      'thoughtful': '🤔',
      'surprised': '😲',
      'excited': '🤩',
      'overwhelmed': '😵',
      'depressed': '😔',
      'frustrated': '😤',
      'worried': '😟',
      'content': '😌',
      'peaceful': '😇',
      'energetic': '⚡'
    };
    
    return emojiMap[emotion] || '😐';
  }

  // Get mental health level description
  getMentalHealthLevelDescription(level: number): string {
    if (level < 0.3) return 'Low';
    if (level < 0.6) return 'Moderate';
    return 'High';
  }

  // Get recommendations based on mental health indicators
  getRecommendations(indicators: EmotionAnalysis['mental_health_indicators']): string[] {
    const recommendations: string[] = [];

    if (indicators.anxiety_level > 0.7) {
      recommendations.push('Consider practicing deep breathing exercises (4-7-8 technique)');
      recommendations.push('Try grounding techniques like the 5-4-3-2-1 method');
      recommendations.push('Consider reaching out to a mental health professional');
    } else if (indicators.anxiety_level > 0.5) {
      recommendations.push('Practice mindfulness or meditation for a few minutes');
      recommendations.push('Try progressive muscle relaxation');
    }

    if (indicators.depression_level > 0.7) {
      recommendations.push('Please consider reaching out to a mental health professional');
      recommendations.push('Connect with friends, family, or support groups');
      recommendations.push('If you\'re having thoughts of self-harm, contact a crisis helpline immediately');
    } else if (indicators.depression_level > 0.5) {
      recommendations.push('Try to engage in activities you usually enjoy');
      recommendations.push('Consider gentle exercise like walking or stretching');
    }

    if (indicators.stress_level > 0.6) {
      recommendations.push('Take regular breaks and practice stress management');
      recommendations.push('Consider organizing your tasks and setting priorities');
      recommendations.push('Try to maintain a healthy sleep schedule');
    }

    if (indicators.positive_sentiment < 0.3) {
      recommendations.push('Try to identify small positive moments in your day');
      recommendations.push('Consider practicing gratitude or self-compassion');
      recommendations.push('Engage in activities that usually bring you joy');
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep taking care of your mental health');
      recommendations.push('Continue practicing self-awareness and emotional check-ins');
    }

    return recommendations;
  }
}

export const emotionService = new EmotionService();
export type { EmotionAnalysis, EmotionResult };