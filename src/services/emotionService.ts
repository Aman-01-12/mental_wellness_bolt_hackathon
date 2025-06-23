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
  private anthropicApiKey: string;

  constructor() {
    this.anthropicApiKey = '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';
  }

  async analyzeEmotion(text: string): Promise<EmotionAnalysis> {
    console.log('🧠 Analyzing emotion with Claude for text:', text.substring(0, 50) + '...');
    
    // Use Claude API directly - NO EDGE FUNCTION, NO FALLBACK
    const prompt = `You are an advanced emotional intelligence AI specializing in comprehensive emotion analysis. Analyze the following text for emotional content:

TEXT TO ANALYZE: "${text}"

Provide a detailed emotional analysis in JSON format with the following structure:

{
  "primary_emotion": "string (the dominant emotion detected)",
  "confidence": number (0-1, confidence in the primary emotion detection),
  "all_emotions": [
    {
      "label": "string (emotion name)",
      "score": number (0-1, intensity/presence of this emotion)
    }
  ],
  "mental_health_indicators": {
    "anxiety_level": number (0-1, level of anxiety detected),
    "depression_level": number (0-1, level of depression/sadness detected),
    "stress_level": number (0-1, level of stress detected),
    "positive_sentiment": number (0-1, level of positive emotions)
  },
  "context_analysis": {
    "tone": "string (overall emotional tone)",
    "intensity": number (0-1, emotional intensity),
    "emotional_complexity": number (1-3, complexity of emotional state),
    "underlying_themes": ["array of strings (deeper emotional themes)"]
  }
}

ANALYSIS REQUIREMENTS:
1. Detect nuanced emotions beyond basic categories
2. Consider context, subtext, and implied emotions
3. Recognize sarcasm, irony, and hidden feelings
4. Analyze linguistic patterns, word choice, and structure
5. Assess mental health indicators based on emotional content
6. Identify underlying psychological themes
7. Consider cultural and personal expression styles
8. Detect crisis language or concerning patterns

Be thorough and accurate. Focus on the emotional essence rather than just keywords. Consider the full context and meaning of the text.`;

    console.log('🤖 Calling Claude API for emotion analysis...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const analysisText = data.content[0].text;
    
    console.log('📊 Claude raw response:', analysisText);

    // Parse JSON response - NO FALLBACK
    try {
      const parsedAnalysis = JSON.parse(analysisText);
      console.log('✅ Claude emotion analysis parsed successfully:', parsedAnalysis);
      return parsedAnalysis;
    } catch (parseError) {
      console.error('❌ Failed to parse Claude response as JSON:', parseError);
      console.error('Raw response:', analysisText);
      throw new Error(`Failed to parse Claude response: ${parseError.message}`);
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