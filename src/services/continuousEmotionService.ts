interface ConversationContext {
  messageHistory: Array<{
    content: string;
    timestamp: Date;
    emotionAnalysis?: EmotionAnalysis;
    responseDelay?: number;
  }>;
  userBaseline: {
    averageResponseTime: number;
    typicalEmotions: string[];
    communicationStyle: string;
    languagePatterns: string[];
  };
  sessionMetrics: {
    startTime: Date;
    messageCount: number;
    emotionalProgression: Array<{
      emotion: string;
      intensity: number;
      timestamp: Date;
    }>;
    detectedTriggers: string[];
  };
}

interface EmotionalTrendAnalysis {
  trend: 'improving' | 'declining' | 'stable' | 'volatile';
  trendStrength: number;
  keyChanges: Array<{
    timestamp: Date;
    change: string;
    significance: number;
  }>;
  patterns: {
    timeBasedPatterns: string[];
    emotionalCycles: string[];
    triggerPatterns: string[];
  };
}

interface ComprehensiveEmotionalAssessment {
  realTimeState: {
    primaryEmotion: string;
    confidence: number;
    intensity: number;
    stability: number;
  };
  contextualFactors: {
    conversationFlow: string;
    responsePatterns: string;
    languageShifts: string[];
    culturalIndicators: string[];
  };
  trendAnalysis: EmotionalTrendAnalysis;
  riskAssessment: {
    level: 'low' | 'moderate' | 'high' | 'critical';
    factors: string[];
    recommendations: string[];
  };
  supportActions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

class ContinuousEmotionService {
  private anthropicApiKey: string;
  private conversationContexts: Map<string, ConversationContext> = new Map();
  private userProfiles: Map<string, any> = new Map();

  constructor() {
    this.anthropicApiKey = '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';
  }

  async analyzeEmotionalContext(
    userId: string,
    message: string,
    timestamp: Date = new Date(),
    responseDelay?: number
  ): Promise<ComprehensiveEmotionalAssessment> {
    try {
      // Get or create conversation context
      let context = this.conversationContexts.get(userId);
      if (!context) {
        context = this.initializeContext(userId);
        this.conversationContexts.set(userId, context);
      }

      // Analyze current message with Claude
      const currentAnalysis = await this.analyzeWithClaude(message, context);

      // Update conversation context
      this.updateContext(context, message, timestamp, currentAnalysis, responseDelay);

      // Perform comprehensive analysis
      const assessment = await this.generateComprehensiveAssessment(context, currentAnalysis);

      // Update user baseline
      this.updateUserBaseline(userId, context, currentAnalysis);

      return assessment;

    } catch (error) {
      console.error('Error in continuous emotion analysis:', error);
      throw error;
    }
  }

  private initializeContext(userId: string): ConversationContext {
    return {
      messageHistory: [],
      userBaseline: {
        averageResponseTime: 30000, // 30 seconds default
        typicalEmotions: [],
        communicationStyle: 'unknown',
        languagePatterns: []
      },
      sessionMetrics: {
        startTime: new Date(),
        messageCount: 0,
        emotionalProgression: [],
        detectedTriggers: []
      }
    };
  }

  private async analyzeWithClaude(message: string, context: ConversationContext): Promise<any> {
    const conversationHistory = context.messageHistory.slice(-5).map(msg => msg.content).join('\n');
    
    const prompt = `You are an advanced emotional intelligence AI specializing in continuous psychological assessment. Analyze the following message in context:

CURRENT MESSAGE: "${message}"

RECENT CONVERSATION HISTORY:
${conversationHistory}

USER BASELINE DATA:
- Typical emotions: ${context.userBaseline.typicalEmotions.join(', ') || 'Unknown'}
- Communication style: ${context.userBaseline.communicationStyle}
- Average response time: ${context.userBaseline.averageResponseTime}ms

ANALYSIS REQUIREMENTS:
1. Emotional State Analysis:
   - Primary emotion and confidence (0-1)
   - Emotional intensity (0-1)
   - Emotional stability (0-1)
   - Secondary emotions present

2. Contextual Understanding:
   - Conversation flow assessment
   - Language style changes from baseline
   - Cultural/personal communication patterns
   - Informal language, slang, colloquialisms detected
   - Sarcasm or implied emotions
   - Subtext and hidden meanings

3. Pattern Recognition:
   - Emotional progression from previous messages
   - Response pattern changes
   - Potential triggers identified
   - Behavioral shifts

4. Risk Assessment:
   - Mental health risk level (low/moderate/high/critical)
   - Crisis indicators
   - Support urgency

5. Linguistic Analysis:
   - Sentence structure changes
   - Vocabulary shifts
   - Punctuation patterns
   - Capitalization usage
   - Emoji/emoticon usage

Respond in JSON format with detailed analysis covering all aspects above. Be thorough and nuanced in your assessment.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.content[0].text;
      
      // Parse JSON response
      try {
        return JSON.parse(analysisText);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return this.fallbackAnalysis(message, context);
      }

    } catch (error) {
      console.error('Claude API error:', error);
      return this.fallbackAnalysis(message, context);
    }
  }

  private fallbackAnalysis(message: string, context: ConversationContext): any {
    // Sophisticated fallback analysis
    const words = message.toLowerCase().split(/\s+/);
    const sentences = message.split(/[.!?]+/).filter(s => s.trim());
    
    // Basic emotion detection
    const emotionKeywords = {
      anxious: ['worried', 'nervous', 'scared', 'panic', 'stress', 'overwhelmed'],
      sad: ['sad', 'depressed', 'down', 'upset', 'crying', 'lonely'],
      angry: ['angry', 'mad', 'furious', 'frustrated', 'annoyed', 'hate'],
      happy: ['happy', 'joy', 'excited', 'great', 'wonderful', 'love'],
      confused: ['confused', 'lost', 'unsure', 'unclear', 'puzzled']
    };

    let primaryEmotion = 'neutral';
    let maxScore = 0;

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const score = keywords.reduce((count, keyword) => {
        return count + (words.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        primaryEmotion = emotion;
      }
    }

    return {
      emotionalState: {
        primaryEmotion,
        confidence: Math.min(maxScore * 0.3, 1),
        intensity: sentences.length > 3 ? 0.7 : 0.5,
        stability: 0.6
      },
      contextualFactors: {
        conversationFlow: 'continuing',
        responsePatterns: 'normal',
        languageShifts: [],
        culturalIndicators: []
      },
      riskAssessment: {
        level: 'low',
        factors: [],
        recommendations: []
      }
    };
  }

  private updateContext(
    context: ConversationContext,
    message: string,
    timestamp: Date,
    analysis: any,
    responseDelay?: number
  ): void {
    // Add to message history
    context.messageHistory.push({
      content: message,
      timestamp,
      emotionAnalysis: analysis,
      responseDelay
    });

    // Keep only last 20 messages
    if (context.messageHistory.length > 20) {
      context.messageHistory = context.messageHistory.slice(-20);
    }

    // Update session metrics
    context.sessionMetrics.messageCount++;
    
    if (analysis.emotionalState) {
      context.sessionMetrics.emotionalProgression.push({
        emotion: analysis.emotionalState.primaryEmotion,
        intensity: analysis.emotionalState.intensity,
        timestamp
      });
    }

    // Update response time baseline
    if (responseDelay && context.messageHistory.length > 1) {
      const currentAvg = context.userBaseline.averageResponseTime;
      context.userBaseline.averageResponseTime = (currentAvg + responseDelay) / 2;
    }
  }

  private async generateComprehensiveAssessment(
    context: ConversationContext,
    currentAnalysis: any
  ): Promise<ComprehensiveEmotionalAssessment> {
    
    // Analyze emotional trends
    const trendAnalysis = this.analyzeTrends(context);
    
    // Generate risk assessment
    const riskAssessment = this.assessRisk(context, currentAnalysis);
    
    // Generate support recommendations
    const supportActions = this.generateSupportActions(context, currentAnalysis, riskAssessment);

    return {
      realTimeState: {
        primaryEmotion: currentAnalysis.emotionalState?.primaryEmotion || 'neutral',
        confidence: currentAnalysis.emotionalState?.confidence || 0.5,
        intensity: currentAnalysis.emotionalState?.intensity || 0.5,
        stability: currentAnalysis.emotionalState?.stability || 0.5
      },
      contextualFactors: {
        conversationFlow: currentAnalysis.contextualFactors?.conversationFlow || 'normal',
        responsePatterns: currentAnalysis.contextualFactors?.responsePatterns || 'normal',
        languageShifts: currentAnalysis.contextualFactors?.languageShifts || [],
        culturalIndicators: currentAnalysis.contextualFactors?.culturalIndicators || []
      },
      trendAnalysis,
      riskAssessment,
      supportActions
    };
  }

  private analyzeTrends(context: ConversationContext): EmotionalTrendAnalysis {
    const progression = context.sessionMetrics.emotionalProgression;
    
    if (progression.length < 3) {
      return {
        trend: 'stable',
        trendStrength: 0.5,
        keyChanges: [],
        patterns: {
          timeBasedPatterns: [],
          emotionalCycles: [],
          triggerPatterns: []
        }
      };
    }

    // Analyze trend direction
    const recentEmotions = progression.slice(-5);
    const intensityTrend = this.calculateIntensityTrend(recentEmotions);
    
    // Detect emotional cycles
    const cycles = this.detectEmotionalCycles(progression);
    
    // Identify key changes
    const keyChanges = this.identifyKeyChanges(progression);

    return {
      trend: intensityTrend.direction,
      trendStrength: intensityTrend.strength,
      keyChanges,
      patterns: {
        timeBasedPatterns: this.detectTimePatterns(progression),
        emotionalCycles: cycles,
        triggerPatterns: context.sessionMetrics.detectedTriggers
      }
    };
  }

  private calculateIntensityTrend(emotions: Array<{emotion: string; intensity: number; timestamp: Date}>): {
    direction: 'improving' | 'declining' | 'stable' | 'volatile';
    strength: number;
  } {
    if (emotions.length < 3) return { direction: 'stable', strength: 0.5 };

    const intensities = emotions.map(e => e.intensity);
    const changes = [];
    
    for (let i = 1; i < intensities.length; i++) {
      changes.push(intensities[i] - intensities[i-1]);
    }

    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const volatility = Math.sqrt(changes.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / changes.length);

    if (volatility > 0.3) {
      return { direction: 'volatile', strength: volatility };
    } else if (avgChange > 0.1) {
      return { direction: 'declining', strength: Math.abs(avgChange) }; // Higher intensity = more distress
    } else if (avgChange < -0.1) {
      return { direction: 'improving', strength: Math.abs(avgChange) };
    } else {
      return { direction: 'stable', strength: 0.5 };
    }
  }

  private detectEmotionalCycles(progression: Array<{emotion: string; intensity: number; timestamp: Date}>): string[] {
    // Simple cycle detection - look for repeating emotional patterns
    const cycles: string[] = [];
    const emotions = progression.map(p => p.emotion);
    
    // Look for alternating patterns
    for (let i = 0; i < emotions.length - 3; i++) {
      const pattern = emotions.slice(i, i + 4);
      if (pattern[0] === pattern[2] && pattern[1] === pattern[3] && pattern[0] !== pattern[1]) {
        cycles.push(`Alternating ${pattern[0]}-${pattern[1]} pattern detected`);
      }
    }

    return cycles;
  }

  private identifyKeyChanges(progression: Array<{emotion: string; intensity: number; timestamp: Date}>): Array<{
    timestamp: Date;
    change: string;
    significance: number;
  }> {
    const changes = [];
    
    for (let i = 1; i < progression.length; i++) {
      const prev = progression[i-1];
      const curr = progression[i];
      
      // Significant emotion change
      if (prev.emotion !== curr.emotion) {
        const intensityChange = Math.abs(curr.intensity - prev.intensity);
        if (intensityChange > 0.3) {
          changes.push({
            timestamp: curr.timestamp,
            change: `Emotional shift from ${prev.emotion} to ${curr.emotion}`,
            significance: intensityChange
          });
        }
      }
      
      // Significant intensity change
      const intensityDiff = curr.intensity - prev.intensity;
      if (Math.abs(intensityDiff) > 0.4) {
        changes.push({
          timestamp: curr.timestamp,
          change: `Intensity ${intensityDiff > 0 ? 'increased' : 'decreased'} significantly`,
          significance: Math.abs(intensityDiff)
        });
      }
    }

    return changes.sort((a, b) => b.significance - a.significance).slice(0, 5);
  }

  private detectTimePatterns(progression: Array<{emotion: string; intensity: number; timestamp: Date}>): string[] {
    // Analyze time-based patterns (simplified)
    const patterns: string[] = [];
    
    if (progression.length < 5) return patterns;

    // Check for time-of-day patterns
    const hourlyEmotions: {[hour: number]: string[]} = {};
    
    progression.forEach(p => {
      const hour = p.timestamp.getHours();
      if (!hourlyEmotions[hour]) hourlyEmotions[hour] = [];
      hourlyEmotions[hour].push(p.emotion);
    });

    // Simple pattern detection
    Object.entries(hourlyEmotions).forEach(([hour, emotions]) => {
      if (emotions.length >= 2) {
        const dominantEmotion = emotions.reduce((a, b) => 
          emotions.filter(e => e === a).length >= emotions.filter(e => e === b).length ? a : b
        );
        patterns.push(`Tends toward ${dominantEmotion} around ${hour}:00`);
      }
    });

    return patterns;
  }

  private assessRisk(context: ConversationContext, currentAnalysis: any): {
    level: 'low' | 'moderate' | 'high' | 'critical';
    factors: string[];
    recommendations: string[];
  } {
    const factors: string[] = [];
    let riskScore = 0;

    // Check current emotional state
    if (currentAnalysis.emotionalState) {
      const { primaryEmotion, intensity } = currentAnalysis.emotionalState;
      
      if (['hopeless', 'suicidal', 'desperate'].includes(primaryEmotion)) {
        riskScore += 0.8;
        factors.push('Severe emotional distress detected');
      } else if (['sad', 'anxious', 'angry'].includes(primaryEmotion) && intensity > 0.7) {
        riskScore += 0.4;
        factors.push('High intensity negative emotion');
      }
    }

    // Check emotional progression
    const progression = context.sessionMetrics.emotionalProgression;
    if (progression.length >= 3) {
      const recentIntensities = progression.slice(-3).map(p => p.intensity);
      const avgIntensity = recentIntensities.reduce((sum, i) => sum + i, 0) / recentIntensities.length;
      
      if (avgIntensity > 0.8) {
        riskScore += 0.3;
        factors.push('Sustained high emotional intensity');
      }
    }

    // Check for crisis keywords in recent messages
    const recentMessages = context.messageHistory.slice(-3).map(m => m.content.toLowerCase()).join(' ');
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'no point', 'give up', 'hopeless'];
    
    if (crisisKeywords.some(keyword => recentMessages.includes(keyword))) {
      riskScore += 0.9;
      factors.push('Crisis language detected');
    }

    // Determine risk level and recommendations
    let level: 'low' | 'moderate' | 'high' | 'critical';
    const recommendations: string[] = [];

    if (riskScore >= 0.8) {
      level = 'critical';
      recommendations.push('Immediate professional intervention recommended');
      recommendations.push('Contact emergency services if imminent danger');
      recommendations.push('Provide crisis hotline numbers');
    } else if (riskScore >= 0.5) {
      level = 'high';
      recommendations.push('Encourage professional mental health support');
      recommendations.push('Increase monitoring frequency');
      recommendations.push('Provide coping resources');
    } else if (riskScore >= 0.3) {
      level = 'moderate';
      recommendations.push('Offer emotional support resources');
      recommendations.push('Suggest stress management techniques');
      recommendations.push('Monitor for changes');
    } else {
      level = 'low';
      recommendations.push('Continue supportive conversation');
      recommendations.push('Maintain regular check-ins');
    }

    return { level, factors, recommendations };
  }

  private generateSupportActions(
    context: ConversationContext,
    currentAnalysis: any,
    riskAssessment: any
  ): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate actions based on current state
    if (riskAssessment.level === 'critical') {
      immediate.push('Provide crisis intervention resources');
      immediate.push('Encourage immediate professional help');
      immediate.push('Stay with user until help arrives if possible');
    } else if (currentAnalysis.emotionalState?.primaryEmotion === 'anxious') {
      immediate.push('Guide through breathing exercises');
      immediate.push('Offer grounding techniques');
      immediate.push('Provide reassurance and validation');
    } else if (currentAnalysis.emotionalState?.primaryEmotion === 'sad') {
      immediate.push('Offer empathetic listening');
      immediate.push('Validate feelings');
      immediate.push('Suggest gentle activities');
    }

    // Short-term actions (next few hours/days)
    if (riskAssessment.level === 'high' || riskAssessment.level === 'moderate') {
      shortTerm.push('Schedule follow-up check-ins');
      shortTerm.push('Provide mental health resources');
      shortTerm.push('Suggest coping strategies');
    }

    shortTerm.push('Monitor emotional patterns');
    shortTerm.push('Encourage self-care activities');
    shortTerm.push('Build support network connections');

    // Long-term actions (weeks/months)
    longTerm.push('Track emotional trends over time');
    longTerm.push('Identify and address recurring triggers');
    longTerm.push('Develop personalized coping strategies');
    longTerm.push('Build emotional resilience');
    longTerm.push('Consider professional therapy if patterns persist');

    return { immediate, shortTerm, longTerm };
  }

  private updateUserBaseline(userId: string, context: ConversationContext, analysis: any): void {
    // Update typical emotions
    if (analysis.emotionalState?.primaryEmotion) {
      const emotion = analysis.emotionalState.primaryEmotion;
      if (!context.userBaseline.typicalEmotions.includes(emotion)) {
        context.userBaseline.typicalEmotions.push(emotion);
        // Keep only top 5 most common emotions
        if (context.userBaseline.typicalEmotions.length > 5) {
          context.userBaseline.typicalEmotions = context.userBaseline.typicalEmotions.slice(-5);
        }
      }
    }

    // Update communication style based on patterns
    if (context.messageHistory.length >= 5) {
      const recentMessages = context.messageHistory.slice(-5);
      const avgLength = recentMessages.reduce((sum, msg) => sum + msg.content.length, 0) / recentMessages.length;
      
      if (avgLength > 200) {
        context.userBaseline.communicationStyle = 'verbose';
      } else if (avgLength < 50) {
        context.userBaseline.communicationStyle = 'concise';
      } else {
        context.userBaseline.communicationStyle = 'moderate';
      }
    }
  }

  // Public method to get user's emotional history
  getEmotionalHistory(userId: string): ConversationContext | null {
    return this.conversationContexts.get(userId) || null;
  }

  // Public method to reset user context (for new sessions)
  resetUserContext(userId: string): void {
    this.conversationContexts.delete(userId);
  }

  // Public method to export user data for analysis
  exportUserData(userId: string): any {
    const context = this.conversationContexts.get(userId);
    if (!context) return null;

    return {
      baseline: context.userBaseline,
      sessionMetrics: context.sessionMetrics,
      recentHistory: context.messageHistory.slice(-10).map(msg => ({
        timestamp: msg.timestamp,
        emotionSummary: msg.emotionAnalysis?.emotionalState,
        messageLength: msg.content.length,
        responseDelay: msg.responseDelay
      }))
    };
  }
}

export const continuousEmotionService = new ContinuousEmotionService();
export type { ComprehensiveEmotionalAssessment, ConversationContext, EmotionalTrendAnalysis };