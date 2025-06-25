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
  fuzzy_indicators?: {
    emotional_stability: number;
    communication_openness: number;
    support_seeking_behavior: number;
    coping_mechanisms: string[];
    relationship_to_emotions: string;
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

  async analyzeEmotion(text: string, userId?: string): Promise<EmotionAnalysis> {
    console.log('🧠 Starting emotion analysis...');
    console.log('📝 Analyzing text:', text.substring(0, 50) + '...');
    
    try {
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

      console.log('✅ Emotion analysis complete:', result.data);
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
      'melancholy': 'text-blue-500',
      'grief': 'text-blue-700',
      'anxious': 'text-yellow-600',
      'worried': 'text-yellow-700',
      'nervous': 'text-yellow-500',
      'angry': 'text-red-600',
      'frustrated': 'text-red-500',
      'irritated': 'text-red-400',
      'happy': 'text-green-600',
      'joyful': 'text-green-500',
      'content': 'text-green-400',
      'grateful': 'text-purple-600',
      'appreciative': 'text-purple-500',
      'confused': 'text-orange-600',
      'uncertain': 'text-orange-500',
      'positive': 'text-emerald-600',
      'optimistic': 'text-emerald-500',
      'neutral': 'text-gray-600',
      'calm': 'text-gray-500',
      'hopeless': 'text-red-700',
      'desperate': 'text-red-800',
      'loving': 'text-pink-600',
      'affectionate': 'text-pink-500',
      'proud': 'text-indigo-600',
      'accomplished': 'text-indigo-500',
      'excited': 'text-yellow-500',
      'enthusiastic': 'text-yellow-400',
      'overwhelmed': 'text-red-500',
      'stressed': 'text-orange-600',
      'depressed': 'text-blue-700',
      'lonely': 'text-blue-600',
      'peaceful': 'text-blue-400',
      'serene': 'text-blue-300',
      'energetic': 'text-orange-500',
      'motivated': 'text-orange-400',
      'vulnerable': 'text-pink-400',
      'open': 'text-green-300',
      'guarded': 'text-gray-600',
      'defensive': 'text-red-400'
    };
    
    return colorMap[emotion] || 'text-gray-600';
  }

  // Get emotion emoji for UI display
  getEmotionEmoji(emotion: string): string {
    const emojiMap: Record<string, string> = {
      'sad': '😢',
      'melancholy': '😔',
      'grief': '💔',
      'anxious': '😰',
      'worried': '😟',
      'nervous': '😬',
      'angry': '😠',
      'frustrated': '😤',
      'irritated': '😑',
      'happy': '😊',
      'joyful': '😄',
      'content': '😌',
      'grateful': '🙏',
      'appreciative': '💕',
      'confused': '😕',
      'uncertain': '🤔',
      'positive': '✨',
      'optimistic': '🌟',
      'neutral': '😐',
      'calm': '😇',
      'loving': '💕',
      'affectionate': '🥰',
      'hopeful': '🌟',
      'proud': '😌',
      'accomplished': '🎉',
      'relieved': '😌',
      'hopeless': '😞',
      'desperate': '😰',
      'thoughtful': '🤔',
      'surprised': '😲',
      'excited': '🤩',
      'enthusiastic': '🔥',
      'overwhelmed': '😵',
      'stressed': '😫',
      'depressed': '😔',
      'lonely': '😞',
      'peaceful': '😇',
      'serene': '🕊️',
      'energetic': '⚡',
      'motivated': '💪',
      'vulnerable': '🥺',
      'open': '🌸',
      'guarded': '🛡️',
      'defensive': '😤'
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
      recommendations.push('Try the 4-7-8 breathing technique when anxiety peaks');
      recommendations.push('Consider grounding techniques like the 5-4-3-2-1 method');
    } else if (indicators.anxiety_level > 0.5) {
      recommendations.push('Take a few deep breaths and remind yourself you\'re safe');
    }

    if (indicators.depression_level > 0.7) {
      recommendations.push('Please consider reaching out to a mental health professional');
      recommendations.push('Connect with friends, family, or support groups when you can');
    } else if (indicators.depression_level > 0.5) {
      recommendations.push('Try to engage in one small activity you usually enjoy');
    }

    if (indicators.stress_level > 0.6) {
      recommendations.push('Try organizing your tasks and setting priorities');
      recommendations.push('Remember to take breaks and practice self-compassion');
    }

    if (indicators.positive_sentiment < 0.3) {
      recommendations.push('Try to identify one small positive moment in your day');
      recommendations.push('Consider practicing gratitude or self-compassion');
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep taking care of your mental health');
      recommendations.push('Continue practicing self-awareness and emotional check-ins');
    }

    return recommendations;
  }

  // Check if emotion analysis indicates need for peer support
  shouldTriggerPeerSupportOffer(analysis: EmotionAnalysis): boolean {
    const { mental_health_indicators, fuzzy_indicators } = analysis;
    
    // High distress indicators
    if (mental_health_indicators.anxiety_level > 0.7 ||
        mental_health_indicators.depression_level > 0.7 ||
        mental_health_indicators.stress_level > 0.8) {
      return true;
    }

    // Support seeking behavior
    if (fuzzy_indicators?.support_seeking_behavior > 0.6) {
      return true;
    }

    // Low emotional stability with moderate distress
    if (fuzzy_indicators?.emotional_stability < 0.4 &&
        (mental_health_indicators.anxiety_level > 0.5 || 
         mental_health_indicators.depression_level > 0.5)) {
      return true;
    }

    return false;
  }

  // Check if emotion analysis indicates crisis situation
  isCrisisSituation(analysis: EmotionAnalysis): boolean {
    const { mental_health_indicators, primary_emotion, fuzzy_indicators } = analysis;
    
    // Crisis emotions
    if (['hopeless', 'desperate', 'suicidal'].includes(primary_emotion)) {
      return true;
    }

    // Very high distress levels
    if (mental_health_indicators.anxiety_level > 0.9 ||
        mental_health_indicators.depression_level > 0.9) {
      return true;
    }

    // Very low emotional stability with high distress
    if (fuzzy_indicators?.emotional_stability < 0.2 &&
        (mental_health_indicators.anxiety_level > 0.7 || 
         mental_health_indicators.depression_level > 0.7)) {
      return true;
    }

    return false;
  }
}

export const emotionService = new EmotionService();
export type { EmotionAnalysis, EmotionResult };