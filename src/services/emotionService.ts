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

  // Advanced context patterns for sophisticated analysis
  private contextPatterns = {
    overwhelmed: [
      /can't handle/i, /too much/i, /overwhelming/i, /drowning/i, /suffocating/i,
      /breaking point/i, /can't cope/i, /falling apart/i, /losing control/i
    ],
    hopeless: [
      /no point/i, /give up/i, /hopeless/i, /nothing matters/i, /what's the use/i,
      /no way out/i, /trapped/i, /stuck/i, /never get better/i
    ],
    anxious: [
      /worried about/i, /scared that/i, /what if/i, /can't stop thinking/i,
      /racing thoughts/i, /panic/i, /nervous/i, /on edge/i, /restless/i
    ],
    depressed: [
      /feel empty/i, /numb/i, /don't care/i, /no energy/i, /exhausted/i,
      /worthless/i, /burden/i, /alone/i, /isolated/i, /dark place/i
    ],
    grateful: [
      /thankful/i, /grateful/i, /blessed/i, /appreciate/i, /lucky/i,
      /fortunate/i, /glad/i, /relieved/i
    ],
    excited: [
      /can't wait/i, /so excited/i, /thrilled/i, /amazing/i, /incredible/i,
      /fantastic/i, /wonderful/i, /awesome/i
    ]
  };

  // Crisis keywords for immediate detection
  private crisisKeywords = [
    'kill myself', 'suicide', 'suicidal', 'end it all', 'no point living', 'want to die', 
    'better off dead', 'can\'t go on', 'hopeless', 'no way out', 'end my life',
    'self harm', 'hurt myself', 'cut myself', 'overdose', 'jump off'
  ];

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!this.supabaseUrl) {
      throw new Error('Supabase URL is not configured');
    }
  }

  async analyzeEmotion(text: string): Promise<EmotionAnalysis> {
    try {
      console.log('🧠 Analyzing emotion for text:', text.substring(0, 50) + '...');
      
      // Call the Supabase Edge Function
      const response = await fetch(`${this.supabaseUrl}/functions/v1/emotion-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ text })
      });

      console.log('📡 Edge function response status:', response.status);

      if (!response.ok) {
        console.warn('⚠️ Edge function error, falling back to client-side analysis');
        return this.advancedFallbackEmotionAnalysis(text);
      }

      const result = await response.json();
      console.log('📊 Edge function result:', result);
      
      if (!result.success || !result.data) {
        console.warn('⚠️ Invalid response from edge function, falling back');
        return this.advancedFallbackEmotionAnalysis(text);
      }

      console.log('✅ Emotion analysis successful:', result.data);
      return result.data;

    } catch (error) {
      console.error('❌ Error calling emotion analysis edge function:', error);
      return this.advancedFallbackEmotionAnalysis(text);
    }
  }

  private analyzeContext(text: string): {
    tone: string;
    intensity: number;
    emotional_complexity: number;
    underlying_themes: string[];
  } {
    const lowerText = text.toLowerCase();
    const themes: string[] = [];
    let intensity = 0.5; // Default medium intensity
    let tone = 'neutral';
    let emotionalComplexity = 1;

    // Intensity modifiers
    const intensityModifiers = {
      high: ['extremely', 'incredibly', 'absolutely', 'completely', 'totally', 'really', 'very', 'so', 'super'],
      medium: ['quite', 'pretty', 'fairly', 'somewhat', 'rather', 'kind of', 'sort of'],
      low: ['a bit', 'slightly', 'a little', 'maybe', 'perhaps', 'might be']
    };

    // Analyze intensity modifiers
    for (const [level, modifiers] of Object.entries(intensityModifiers)) {
      for (const modifier of modifiers) {
        if (lowerText.includes(modifier)) {
          switch (level) {
            case 'high': intensity = Math.min(intensity + 0.3, 1); break;
            case 'medium': intensity = Math.min(intensity + 0.1, 1); break;
            case 'low': intensity = Math.max(intensity - 0.2, 0); break;
          }
        }
      }
    }

    // Check for negation patterns
    const negationPatterns = [
      /not\s+\w+/i, /don't\s+\w+/i, /can't\s+\w+/i, /won't\s+\w+/i,
      /never\s+\w+/i, /no\s+\w+/i, /nothing\s+\w+/i, /nobody\s+\w+/i
    ];
    
    const hasNegation = negationPatterns.some(pattern => pattern.test(text));
    if (hasNegation) {
      intensity *= 0.8;
      themes.push('negation');
    }

    // Analyze context patterns
    let maxPatternScore = 0;
    let dominantEmotion = 'neutral';

    for (const [emotion, patterns] of Object.entries(this.contextPatterns)) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          score += 1;
        }
      }
      
      if (score > 0) {
        themes.push(emotion);
        if (score > maxPatternScore) {
          maxPatternScore = score;
          dominantEmotion = emotion;
          tone = emotion;
        }
      }
    }

    // Calculate emotional complexity
    emotionalComplexity = Math.min(themes.length * 0.5 + 1, 3);

    // Analyze sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    
    // Short sentences might indicate urgency or distress
    if (avgSentenceLength < 20 && sentences.length > 1) {
      intensity = Math.min(intensity + 0.2, 1);
      themes.push('urgency');
    }

    // Long sentences might indicate overthinking
    if (avgSentenceLength > 100) {
      themes.push('overthinking');
      if (dominantEmotion === 'anxious' || dominantEmotion === 'confused') {
        intensity = Math.min(intensity + 0.1, 1);
      }
    }

    return {
      tone,
      intensity,
      emotional_complexity: emotionalComplexity,
      underlying_themes: themes
    };
  }

  private advancedFallbackEmotionAnalysis(text: string): EmotionAnalysis {
    console.log('🔄 Using advanced fallback emotion analysis for:', text.substring(0, 50) + '...');
    
    const context = this.analyzeContext(text);
    console.log('🎯 Context analysis:', context);
    
    const emotionScores: EmotionResult[] = [];
    
    // Use context themes to determine emotions
    for (const theme of context.underlying_themes) {
      if (theme in this.contextPatterns) {
        emotionScores.push({
          label: theme,
          score: Math.min(0.6 + (context.intensity * 0.4), 1)
        });
      }
    }

    // If no themes detected, use advanced sentiment analysis
    if (emotionScores.length === 0) {
      const sentimentAnalysis = this.analyzeSentiment(text);
      emotionScores.push({
        label: sentimentAnalysis.emotion,
        score: sentimentAnalysis.confidence * context.intensity
      });
    }

    // Sort by score
    emotionScores.sort((a, b) => b.score - a.score);

    const mentalHealthIndicators = this.calculateAdvancedMentalHealthIndicators(text, emotionScores, context);

    const result = {
      primary_emotion: emotionScores[0].label,
      confidence: emotionScores[0].score,
      all_emotions: emotionScores,
      mental_health_indicators: mentalHealthIndicators,
      context_analysis: context
    };

    console.log('📈 Advanced fallback analysis result:', result);
    return result;
  }

  private analyzeSentiment(text: string): { emotion: string; confidence: number } {
    const lowerText = text.toLowerCase();
    
    // Advanced sentiment patterns
    const sentimentPatterns = {
      positive: {
        words: ['good', 'great', 'happy', 'love', 'amazing', 'wonderful', 'excellent', 'fantastic', 'awesome', 'brilliant'],
        phrases: [/feel good/i, /so happy/i, /love it/i, /going well/i, /feeling great/i]
      },
      negative: {
        words: ['bad', 'terrible', 'awful', 'hate', 'horrible', 'worst', 'sad', 'angry', 'upset', 'disappointed'],
        phrases: [/feel bad/i, /so sad/i, /hate it/i, /going wrong/i, /feeling terrible/i]
      },
      anxious: {
        words: ['worried', 'nervous', 'scared', 'afraid', 'panic', 'stress', 'anxious'],
        phrases: [/can't sleep/i, /keep thinking/i, /what if/i, /so worried/i]
      },
      confused: {
        words: ['confused', 'lost', 'unclear', 'uncertain', 'puzzled'],
        phrases: [/don't know/i, /not sure/i, /confused about/i]
      }
    };

    let maxScore = 0;
    let dominantEmotion = 'neutral';

    for (const [emotion, patterns] of Object.entries(sentimentPatterns)) {
      let score = 0;
      
      // Count word matches
      for (const word of patterns.words) {
        const matches = (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
        score += matches * 0.3;
      }
      
      // Count phrase matches (higher weight)
      for (const phrase of patterns.phrases) {
        if (phrase.test(text)) {
          score += 0.5;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion;
      }
    }

    return {
      emotion: dominantEmotion,
      confidence: Math.min(maxScore, 1)
    };
  }

  private calculateAdvancedMentalHealthIndicators(
    text: string, 
    emotions: EmotionResult[], 
    context: any
  ): {
    anxiety_level: number;
    depression_level: number;
    stress_level: number;
    positive_sentiment: number;
  } {
    // Base scores from emotion analysis
    const anxiousEmotions = emotions.filter(e => 
      ['anxious', 'fear', 'nervousness', 'worried', 'overwhelmed'].includes(e.label)
    ).reduce((sum, e) => sum + e.score, 0);

    const sadEmotions = emotions.filter(e => 
      ['sad', 'grief', 'disappointment', 'hopeless', 'depressed'].includes(e.label)
    ).reduce((sum, e) => sum + e.score, 0);

    const positiveEmotions = emotions.filter(e => 
      ['happy', 'joy', 'excitement', 'gratitude', 'love', 'positive', 'proud', 'grateful', 'excited'].includes(e.label)
    ).reduce((sum, e) => sum + e.score, 0);

    const stressEmotions = emotions.filter(e => 
      ['frustrated', 'overwhelmed', 'angry', 'annoyed'].includes(e.label)
    ).reduce((sum, e) => sum + e.score, 0);

    // Context-based adjustments
    let anxietyBoost = 0;
    let depressionBoost = 0;
    let stressBoost = 0;
    let positiveBoost = 0;

    // Analyze underlying themes
    if (context.underlying_themes.includes('overwhelmed')) {
      anxietyBoost += 0.3;
      stressBoost += 0.4;
    }
    
    if (context.underlying_themes.includes('hopeless')) {
      depressionBoost += 0.5;
      anxietyBoost += 0.2;
    }
    
    if (context.underlying_themes.includes('anxious')) {
      anxietyBoost += 0.3;
    }
    
    if (context.underlying_themes.includes('depressed')) {
      depressionBoost += 0.4;
    }

    if (context.underlying_themes.includes('grateful') || context.underlying_themes.includes('excited')) {
      positiveBoost += 0.3;
    }

    // Crisis detection
    const hasCrisis = this.crisisKeywords.some(keyword => text.toLowerCase().includes(keyword));
    const crisisBoost = hasCrisis ? 0.6 : 0;

    // Intensity affects all scores
    const intensityMultiplier = context.intensity;

    return {
      anxiety_level: Math.min((anxiousEmotions + anxietyBoost + crisisBoost) * intensityMultiplier, 1),
      depression_level: Math.min((sadEmotions + depressionBoost + crisisBoost) * intensityMultiplier, 1),
      stress_level: Math.min((stressEmotions + stressBoost + (crisisBoost * 0.5)) * intensityMultiplier, 1),
      positive_sentiment: Math.max(Math.min((positiveEmotions + positiveBoost) * intensityMultiplier, 1) - crisisBoost, 0)
    };
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
      'depressed': 'text-blue-700'
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
      'depressed': '😔'
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