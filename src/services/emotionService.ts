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

interface EmotionalPattern {
  pattern_type: string;
  confidence: number;
  indicators: string[];
  human_interpretation: string;
}

class EmotionService {
  private supabaseUrl: string;
  private emotionalMemory: Map<string, Array<{
    timestamp: Date;
    content: string;
    analysis: EmotionAnalysis;
    context: any;
  }>> = new Map();

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!this.supabaseUrl) {
      throw new Error('Supabase URL is not configured');
    }
  }

  async analyzeEmotion(text: string, userId?: string): Promise<EmotionAnalysis> {
    console.log('🧠 Starting human-like emotion analysis with fuzzy logic...');
    console.log('📝 Analyzing text:', text.substring(0, 50) + '...');
    
    try {
      // Get user's emotional history for context
      const emotionalHistory = userId ? this.getEmotionalHistory(userId) : [];
      
      // Perform advanced fuzzy logic analysis
      const fuzzyAnalysis = await this.performFuzzyEmotionAnalysis(text, emotionalHistory);
      
      // Store in emotional memory for learning
      if (userId) {
        this.updateEmotionalMemory(userId, text, fuzzyAnalysis);
      }
      
      console.log('✅ Human-like emotion analysis complete:', fuzzyAnalysis);
      return fuzzyAnalysis;

    } catch (error) {
      console.error('❌ Error in emotion analysis:', error);
      throw new Error(`Emotion analysis failed: ${error.message}`);
    }
  }

  private async performFuzzyEmotionAnalysis(
    text: string, 
    history: Array<any> = []
  ): Promise<EmotionAnalysis> {
    
    const prompt = `You are an advanced emotional intelligence system that understands emotions like a human psychologist with decades of experience. Your task is to analyze text using fuzzy logic and human-like reasoning, not just keyword matching.

HUMAN-LIKE EMOTIONAL UNDERSTANDING:
- Emotions are complex, layered, and often contradictory
- Context matters more than specific words
- People express emotions differently based on personality, culture, situation
- Subtext and what's NOT said is often more important
- Emotional patterns emerge over time, not just in single messages
- Body language equivalents in text (punctuation, spacing, capitalization)
- Defensive mechanisms, emotional walls, and vulnerability indicators
- Coping strategies and emotional regulation attempts

TEXT TO ANALYZE: "${text}"

${history.length > 0 ? `
EMOTIONAL HISTORY CONTEXT:
Recent emotional patterns: ${history.slice(-3).map(h => `${h.primary_emotion} (${h.context_analysis?.tone})`).join(', ')}
Communication style evolution: ${this.analyzeStyleEvolution(history)}
Emotional stability trend: ${this.calculateStabilityTrend(history)}
` : ''}

FUZZY LOGIC ANALYSIS REQUIREMENTS:

1. **Emotional Layering** (like humans feel multiple emotions simultaneously):
   - Primary emotion (most dominant)
   - Secondary emotions (underlying/mixed feelings)
   - Hidden emotions (what they might not be expressing)
   - Emotional conflicts (contradictory feelings)

2. **Contextual Reasoning** (human-like interpretation):
   - What life situation might this reflect?
   - What emotional needs are being expressed?
   - What coping mechanisms are being used?
   - What support might they be seeking?
   - What emotional defenses are up?

3. **Communication Style Analysis**:
   - Emotional openness level (0-1)
   - Vulnerability indicators
   - Emotional regulation attempts
   - Support-seeking vs. self-reliance patterns
   - Communication barriers or walls

4. **Fuzzy Mental Health Indicators** (gradual, not binary):
   - Anxiety patterns (not just "anxious" words)
   - Depression indicators (energy, hope, connection patterns)
   - Stress manifestations (overwhelm, pressure, time concerns)
   - Positive sentiment (hope, gratitude, connection, growth)
   - Emotional resilience indicators

5. **Human Interpretation Patterns**:
   - What would a caring friend notice?
   - What would a therapist pick up on?
   - What emotional themes are emerging?
   - What growth or healing opportunities exist?

6. **Temporal and Relational Context**:
   - How does this fit their emotional journey?
   - What relationship dynamics might be involved?
   - What life transitions or challenges might be present?
   - What strengths and resources do they have?

RESPONSE FORMAT (JSON):
{
  "primary_emotion": "string (nuanced, not just basic emotions)",
  "confidence": number (0-1, based on clarity of emotional expression),
  "all_emotions": [
    {
      "label": "string (include subtle, complex emotions)",
      "score": number (0-1, fuzzy membership)
    }
  ],
  "mental_health_indicators": {
    "anxiety_level": number (0-1, based on patterns, not keywords),
    "depression_level": number (0-1, energy/hope/connection patterns),
    "stress_level": number (0-1, overwhelm/pressure indicators),
    "positive_sentiment": number (0-1, hope/growth/connection)
  },
  "context_analysis": {
    "tone": "string (emotional atmosphere)",
    "intensity": number (0-1, emotional charge),
    "emotional_complexity": number (1-3, how layered the emotions are),
    "underlying_themes": ["array of deeper emotional themes"]
  },
  "fuzzy_indicators": {
    "emotional_stability": number (0-1, emotional regulation),
    "communication_openness": number (0-1, willingness to share),
    "support_seeking_behavior": number (0-1, reaching out vs. withdrawing),
    "coping_mechanisms": ["array of observed coping strategies"],
    "relationship_to_emotions": "string (how they relate to their feelings)"
  }
}

EXAMPLES OF HUMAN-LIKE REASONING:

Instead of: "Contains word 'fine' = neutral emotion"
Think like: "Says they're 'fine' but context suggests they're actually struggling and don't want to burden others"

Instead of: "No sad words = not sad"
Think like: "Very short responses, lack of usual enthusiasm, might be withdrawing due to sadness"

Instead of: "Contains 'stressed' = high stress"
Think like: "Mentions being 'a bit stressed' but tone suggests they're minimizing significant overwhelm"

Instead of: "Positive words = happy"
Think like: "Using positive language but seems forced, might be trying to convince themselves or others"

FOCUS ON:
- Emotional subtext and implications
- What they're NOT saying directly
- Patterns of emotional expression
- Defensive or protective language
- Vulnerability and openness levels
- Coping and regulation attempts
- Relational and social context
- Growth and healing indicators
- Strength and resilience markers

Analyze with the wisdom of human emotional intelligence, not just computational pattern matching. Respond ONLY with valid JSON.`;

    console.log('🤖 Calling advanced fuzzy emotion analysis...');

    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/qwen-emotion-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ text: prompt })
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

      // Enhance the analysis with additional fuzzy logic processing
      const enhancedAnalysis = this.enhanceWithFuzzyLogic(result.data, text);
      
      console.log('✅ Fuzzy emotion analysis complete:', enhancedAnalysis);
      return enhancedAnalysis;

    } catch (error) {
      console.error('❌ Error in fuzzy emotion analysis:', error);
      throw new Error(`Fuzzy emotion analysis failed: ${error.message}`);
    }
  }

  private enhanceWithFuzzyLogic(analysis: any, originalText: string): EmotionAnalysis {
    // Apply additional fuzzy logic processing
    const textLength = originalText.length;
    const wordCount = originalText.split(/\s+/).length;
    
    // Fuzzy logic for communication patterns
    const communicationOpenness = this.calculateCommunicationOpenness(originalText, analysis);
    const emotionalStability = this.calculateEmotionalStability(analysis);
    const supportSeekingBehavior = this.calculateSupportSeeking(originalText, analysis);
    
    // Detect coping mechanisms through fuzzy pattern matching
    const copingMechanisms = this.detectCopingMechanisms(originalText, analysis);
    
    // Determine relationship to emotions
    const relationshipToEmotions = this.analyzeEmotionalRelationship(originalText, analysis);
    
    return {
      ...analysis,
      fuzzy_indicators: {
        emotional_stability: emotionalStability,
        communication_openness: communicationOpenness,
        support_seeking_behavior: supportSeekingBehavior,
        coping_mechanisms: copingMechanisms,
        relationship_to_emotions: relationshipToEmotions
      }
    };
  }

  private calculateCommunicationOpenness(text: string, analysis: any): number {
    let openness = 0.5; // Start neutral
    
    // Indicators of openness
    if (text.includes('I feel') || text.includes('I\'m feeling')) openness += 0.2;
    if (text.includes('honestly') || text.includes('to be honest')) openness += 0.15;
    if (text.length > 100) openness += 0.1; // Longer messages suggest more sharing
    if (text.includes('?')) openness += 0.1; // Questions suggest engagement
    
    // Indicators of closedness
    if (text.includes('fine') || text.includes('okay') || text.includes('whatever')) openness -= 0.15;
    if (text.length < 20) openness -= 0.2; // Very short might indicate withdrawal
    if (text.includes('don\'t want to talk') || text.includes('nothing')) openness -= 0.3;
    
    // Emotional intensity affects openness
    if (analysis.context_analysis?.intensity > 0.7) openness += 0.1;
    
    return Math.max(0, Math.min(1, openness));
  }

  private calculateEmotionalStability(analysis: any): number {
    let stability = 0.7; // Start with assumption of general stability
    
    // Factors that decrease stability
    if (analysis.mental_health_indicators?.anxiety_level > 0.6) stability -= 0.2;
    if (analysis.mental_health_indicators?.depression_level > 0.6) stability -= 0.2;
    if (analysis.context_analysis?.emotional_complexity > 2) stability -= 0.15;
    if (analysis.context_analysis?.intensity > 0.8) stability -= 0.1;
    
    // Factors that increase stability
    if (analysis.mental_health_indicators?.positive_sentiment > 0.6) stability += 0.1;
    if (analysis.primary_emotion === 'content' || analysis.primary_emotion === 'peaceful') stability += 0.15;
    
    return Math.max(0, Math.min(1, stability));
  }

  private calculateSupportSeeking(text: string, analysis: any): number {
    let supportSeeking = 0.3; // Start low
    
    // Direct support seeking indicators
    if (text.includes('help') || text.includes('advice') || text.includes('what should I')) supportSeeking += 0.3;
    if (text.includes('anyone else') || text.includes('has anyone')) supportSeeking += 0.2;
    if (text.includes('I don\'t know') || text.includes('confused')) supportSeeking += 0.15;
    
    // Indirect support seeking
    if (text.includes('?')) supportSeeking += 0.1; // Questions often seek engagement
    if (analysis.mental_health_indicators?.anxiety_level > 0.5) supportSeeking += 0.1;
    if (analysis.mental_health_indicators?.depression_level > 0.5) supportSeeking += 0.1;
    
    // Self-reliance indicators (reduce support seeking)
    if (text.includes('I\'ll figure it out') || text.includes('I can handle')) supportSeeking -= 0.2;
    if (text.includes('I\'m fine') || text.includes('no big deal')) supportSeeking -= 0.15;
    
    return Math.max(0, Math.min(1, supportSeeking));
  }

  private detectCopingMechanisms(text: string, analysis: any): string[] {
    const mechanisms: string[] = [];
    
    // Positive coping mechanisms
    if (text.match(/exercise|workout|run|walk|gym/i)) mechanisms.push('Physical activity');
    if (text.match(/meditat|mindful|breath|calm/i)) mechanisms.push('Mindfulness/meditation');
    if (text.match(/friend|talk|share|call/i)) mechanisms.push('Social support');
    if (text.match(/music|art|creat|write|draw/i)) mechanisms.push('Creative expression');
    if (text.match(/sleep|rest|nap/i)) mechanisms.push('Rest and recovery');
    if (text.match(/plan|organiz|list|schedul/i)) mechanisms.push('Planning and organization');
    
    // Potentially concerning coping mechanisms
    if (text.match(/drink|alcohol|smoke/i)) mechanisms.push('Substance use');
    if (text.match(/avoid|ignore|pretend|distract/i)) mechanisms.push('Avoidance');
    if (text.match(/isolat|alone|withdraw|hide/i)) mechanisms.push('Social withdrawal');
    if (text.match(/work|busy|distract/i) && analysis.mental_health_indicators?.stress_level > 0.6) {
      mechanisms.push('Work/busyness as distraction');
    }
    
    // Emotional regulation attempts
    if (text.match(/try to|trying to|attempt|effort/i)) mechanisms.push('Active emotional regulation');
    if (text.match(/positive|grateful|thankful/i)) mechanisms.push('Positive reframing');
    
    return mechanisms;
  }

  private analyzeEmotionalRelationship(text: string, analysis: any): string {
    // How does the person relate to their emotions?
    
    if (text.match(/shouldn\'t feel|wrong to feel|bad for feeling/i)) {
      return 'Self-critical about emotions';
    }
    
    if (text.match(/I feel|I\'m feeling|my emotions/i)) {
      return 'Emotionally aware and accepting';
    }
    
    if (text.match(/don\'t understand|confused about|why am I/i)) {
      return 'Seeking emotional understanding';
    }
    
    if (text.match(/fine|okay|whatever|doesn\'t matter/i) && analysis.context_analysis?.intensity > 0.5) {
      return 'Minimizing or dismissing emotions';
    }
    
    if (analysis.mental_health_indicators?.positive_sentiment > 0.7) {
      return 'Positive emotional relationship';
    }
    
    if (analysis.mental_health_indicators?.anxiety_level > 0.6) {
      return 'Anxious about emotions';
    }
    
    return 'Neutral emotional relationship';
  }

  private analyzeStyleEvolution(history: Array<any>): string {
    if (history.length < 2) return 'Insufficient data';
    
    const recent = history.slice(-3);
    const openness = recent.map(h => h.fuzzy_indicators?.communication_openness || 0.5);
    const avgOpenness = openness.reduce((a, b) => a + b, 0) / openness.length;
    
    if (avgOpenness > 0.7) return 'Increasingly open communication';
    if (avgOpenness < 0.3) return 'Becoming more guarded';
    return 'Stable communication style';
  }

  private calculateStabilityTrend(history: Array<any>): string {
    if (history.length < 3) return 'Establishing baseline';
    
    const recent = history.slice(-3);
    const stability = recent.map(h => h.fuzzy_indicators?.emotional_stability || 0.5);
    
    const trend = stability[2] - stability[0];
    if (trend > 0.2) return 'Improving emotional stability';
    if (trend < -0.2) return 'Decreasing emotional stability';
    return 'Stable emotional patterns';
  }

  private updateEmotionalMemory(userId: string, text: string, analysis: EmotionAnalysis): void {
    if (!this.emotionalMemory.has(userId)) {
      this.emotionalMemory.set(userId, []);
    }
    
    const userMemory = this.emotionalMemory.get(userId)!;
    userMemory.push({
      timestamp: new Date(),
      content: text,
      analysis,
      context: {
        length: text.length,
        wordCount: text.split(/\s+/).length
      }
    });
    
    // Keep only last 20 entries to prevent memory issues
    if (userMemory.length > 20) {
      userMemory.splice(0, userMemory.length - 20);
    }
  }

  private getEmotionalHistory(userId: string): Array<any> {
    return this.emotionalMemory.get(userId) || [];
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

  // Get recommendations based on mental health indicators and fuzzy analysis
  getRecommendations(indicators: EmotionAnalysis['mental_health_indicators'], fuzzyIndicators?: EmotionAnalysis['fuzzy_indicators']): string[] {
    const recommendations: string[] = [];

    // Use fuzzy logic for more nuanced recommendations
    if (indicators.anxiety_level > 0.7) {
      if (fuzzyIndicators?.coping_mechanisms.includes('Mindfulness/meditation')) {
        recommendations.push('Continue your mindfulness practice - it seems to be helping');
      } else {
        recommendations.push('Try the 4-7-8 breathing technique when anxiety peaks');
      }
      recommendations.push('Consider grounding techniques like the 5-4-3-2-1 method');
    } else if (indicators.anxiety_level > 0.5) {
      recommendations.push('Take a few deep breaths and remind yourself you\'re safe');
      if (fuzzyIndicators?.support_seeking_behavior > 0.6) {
        recommendations.push('Reaching out for support shows real strength');
      }
    }

    if (indicators.depression_level > 0.7) {
      recommendations.push('Please consider reaching out to a mental health professional');
      if (fuzzyIndicators?.communication_openness > 0.5) {
        recommendations.push('Your openness about your feelings is a positive step');
      }
      recommendations.push('Connect with friends, family, or support groups when you can');
    } else if (indicators.depression_level > 0.5) {
      if (fuzzyIndicators?.coping_mechanisms.includes('Social withdrawal')) {
        recommendations.push('Even small social connections can help lift your mood');
      } else {
        recommendations.push('Try to engage in one small activity you usually enjoy');
      }
    }

    if (indicators.stress_level > 0.6) {
      if (fuzzyIndicators?.coping_mechanisms.includes('Planning and organization')) {
        recommendations.push('Your organizational approach is good - break things down further');
      } else {
        recommendations.push('Try organizing your tasks and setting priorities');
      }
      recommendations.push('Remember to take breaks and practice self-compassion');
    }

    if (indicators.positive_sentiment < 0.3) {
      if (fuzzyIndicators?.relationship_to_emotions === 'Self-critical about emotions') {
        recommendations.push('Be gentle with yourself - your feelings are valid');
      } else {
        recommendations.push('Try to identify one small positive moment in your day');
      }
      recommendations.push('Consider practicing gratitude or self-compassion');
    }

    // Recommendations based on fuzzy indicators
    if (fuzzyIndicators) {
      if (fuzzyIndicators.emotional_stability < 0.4) {
        recommendations.push('Focus on creating small, predictable routines for stability');
      }
      
      if (fuzzyIndicators.communication_openness < 0.3) {
        recommendations.push('When you\'re ready, sharing your feelings can bring relief');
      }
      
      if (fuzzyIndicators.support_seeking_behavior < 0.2) {
        recommendations.push('Remember that asking for help is a sign of wisdom, not weakness');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep taking care of your mental health');
      recommendations.push('Continue practicing self-awareness and emotional check-ins');
    }

    return recommendations;
  }

  // Reset emotional memory for a user (for privacy/new sessions)
  resetEmotionalMemory(userId: string): void {
    this.emotionalMemory.delete(userId);
  }

  // Get emotional insights for a user
  getEmotionalInsights(userId: string): any {
    const history = this.getEmotionalHistory(userId);
    if (history.length === 0) return null;

    const recent = history.slice(-5);
    const patterns = this.detectEmotionalPatterns(recent);
    const growth = this.detectEmotionalGrowth(history);
    
    return {
      patterns,
      growth,
      communication_evolution: this.analyzeStyleEvolution(history),
      stability_trend: this.calculateStabilityTrend(history),
      strengths: this.identifyEmotionalStrengths(recent),
      areas_for_growth: this.identifyGrowthAreas(recent)
    };
  }

  private detectEmotionalPatterns(messages: Array<any>): EmotionalPattern[] {
    const patterns: EmotionalPattern[] = [];
    
    // Pattern detection logic would go here
    // This is a simplified version
    
    return patterns;
  }

  private detectEmotionalGrowth(history: Array<any>): any {
    if (history.length < 5) return null;
    
    const early = history.slice(0, Math.floor(history.length / 2));
    const recent = history.slice(Math.floor(history.length / 2));
    
    const earlyAvgStability = early.reduce((sum, h) => sum + (h.analysis.fuzzy_indicators?.emotional_stability || 0.5), 0) / early.length;
    const recentAvgStability = recent.reduce((sum, h) => sum + (h.analysis.fuzzy_indicators?.emotional_stability || 0.5), 0) / recent.length;
    
    return {
      stability_improvement: recentAvgStability - earlyAvgStability,
      communication_growth: this.analyzeStyleEvolution(history),
      emotional_vocabulary_expansion: this.analyzeVocabularyGrowth(early, recent)
    };
  }

  private analyzeVocabularyGrowth(early: Array<any>, recent: Array<any>): string {
    // Simplified analysis
    const earlyEmotions = new Set(early.map(h => h.analysis.primary_emotion));
    const recentEmotions = new Set(recent.map(h => h.analysis.primary_emotion));
    
    if (recentEmotions.size > earlyEmotions.size) {
      return 'Expanding emotional vocabulary';
    }
    return 'Stable emotional expression';
  }

  private identifyEmotionalStrengths(recent: Array<any>): string[] {
    const strengths: string[] = [];
    
    const avgOpenness = recent.reduce((sum, h) => sum + (h.analysis.fuzzy_indicators?.communication_openness || 0.5), 0) / recent.length;
    const avgSupportSeeking = recent.reduce((sum, h) => sum + (h.analysis.fuzzy_indicators?.support_seeking_behavior || 0.3), 0) / recent.length;
    
    if (avgOpenness > 0.6) strengths.push('Emotional openness and vulnerability');
    if (avgSupportSeeking > 0.5) strengths.push('Healthy help-seeking behavior');
    
    const positiveCoping = recent.some(h => 
      h.analysis.fuzzy_indicators?.coping_mechanisms.some((m: string) => 
        ['Physical activity', 'Mindfulness/meditation', 'Social support', 'Creative expression'].includes(m)
      )
    );
    
    if (positiveCoping) strengths.push('Positive coping strategies');
    
    return strengths;
  }

  private identifyGrowthAreas(recent: Array<any>): string[] {
    const areas: string[] = [];
    
    const avgStability = recent.reduce((sum, h) => sum + (h.analysis.fuzzy_indicators?.emotional_stability || 0.7), 0) / recent.length;
    
    if (avgStability < 0.4) areas.push('Emotional regulation and stability');
    
    const hasAvoidanceCoping = recent.some(h => 
      h.analysis.fuzzy_indicators?.coping_mechanisms.some((m: string) => 
        ['Avoidance', 'Social withdrawal', 'Substance use'].includes(m)
      )
    );
    
    if (hasAvoidanceCoping) areas.push('Developing healthier coping mechanisms');
    
    return areas;
  }
}

export const emotionService = new EmotionService();
export type { EmotionAnalysis, EmotionResult, EmotionalPattern };