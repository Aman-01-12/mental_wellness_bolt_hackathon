interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface UserCommunicationStyle {
  messageLength: 'short' | 'medium' | 'long';
  formality: 'casual' | 'semi-formal' | 'formal';
  emotiveness: 'reserved' | 'moderate' | 'expressive';
  punctuationStyle: 'minimal' | 'standard' | 'expressive';
  vocabularyLevel: 'simple' | 'moderate' | 'complex';
  responsePattern: 'quick' | 'thoughtful' | 'detailed';
  preferredTone: 'supportive' | 'encouraging' | 'understanding' | 'gentle';
  communicationPreferences: string[];
  emotionalPatterns: {
    openness_trend: 'increasing' | 'decreasing' | 'stable';
    vulnerability_comfort: number; // 0-1
    support_seeking_style: 'direct' | 'indirect' | 'reluctant';
    emotional_processing_style: 'analytical' | 'intuitive' | 'avoidant';
  };
}

interface EmotionalContext {
  current_state: string;
  intensity: number;
  stability: number;
  openness: number;
  support_needs: string[];
  coping_mechanisms: string[];
  relationship_to_emotions: string;
}

class AIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  private userStyles: Map<string, UserCommunicationStyle> = new Map();
  private conversationHistory: Map<string, ChatMessage[]> = new Map();
  private emotionalContexts: Map<string, EmotionalContext[]> = new Map();

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('Google Gemini API key is not configured');
    }
  }

  private analyzeUserCommunicationStyle(messages: ChatMessage[], emotionalHistory: EmotionalContext[] = []): UserCommunicationStyle {
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    if (userMessages.length === 0) {
      return this.getDefaultStyle();
    }

    // Enhanced analysis with fuzzy logic
    const avgLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;
    const messageLength = avgLength < 40 ? 'short' : avgLength < 120 ? 'medium' : 'long';

    // Analyze formality with more nuanced detection
    const casualIndicators = ['lol', 'omg', 'tbh', 'ngl', 'fr', 'bruh', 'yeah', 'yep', 'nah', 'gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'idk', 'rn'];
    const formalIndicators = ['however', 'therefore', 'furthermore', 'nevertheless', 'consequently', 'regarding', 'concerning'];
    
    const casualScore = this.calculateIndicatorScore(userMessages, casualIndicators);
    const formalScore = this.calculateIndicatorScore(userMessages, formalIndicators);
    
    const formality = casualScore > formalScore * 2 ? 'casual' : 
                     formalScore > casualScore ? 'formal' : 'semi-formal';

    // Enhanced emotiveness analysis
    const emotiveIndicators = ['!', '...', '😊', '😢', '😭', '❤️', '💕', '😍', '😔', '😰', '😤', '🥺', '💔', '🙏', '✨'];
    const emotiveScore = this.calculateIndicatorScore(userMessages, emotiveIndicators);
    
    const emotiveness = emotiveScore > userMessages.length * 1.5 ? 'expressive' : 
                       emotiveScore > userMessages.length * 0.5 ? 'moderate' : 'reserved';

    // Analyze punctuation patterns
    const punctuationScore = userMessages.reduce((score, msg) => {
      const exclamations = (msg.content.match(/!/g) || []).length;
      const ellipsis = (msg.content.match(/\.\.\./g) || []).length;
      const questions = (msg.content.match(/\?/g) || []).length;
      return score + exclamations + ellipsis + questions;
    }, 0);
    
    const punctuationStyle = punctuationScore > userMessages.length * 1.5 ? 'expressive' :
                            punctuationScore > userMessages.length * 0.3 ? 'standard' : 'minimal';

    // Vocabulary complexity analysis
    const complexWords = ['consequently', 'furthermore', 'nevertheless', 'sophisticated', 'comprehensive', 'intricate', 'nuanced', 'elaborate'];
    const complexScore = this.calculateIndicatorScore(userMessages, complexWords);
    
    const vocabularyLevel = complexScore > 0 ? 'complex' : avgLength > 80 ? 'moderate' : 'simple';

    // Response pattern preference
    const responsePattern = messageLength === 'long' ? 'detailed' : 
                           messageLength === 'medium' ? 'thoughtful' : 'quick';

    // Emotional patterns analysis
    const emotionalPatterns = this.analyzeEmotionalPatterns(userMessages, emotionalHistory);

    // Preferred tone based on emotional context
    const preferredTone = this.determinePreferredTone(userMessages, emotionalHistory);

    // Communication preferences
    const communicationPreferences = this.identifyCommunicationPreferences(
      formality, emotiveness, messageLength, punctuationStyle, emotionalPatterns
    );

    return {
      messageLength,
      formality,
      emotiveness,
      punctuationStyle,
      vocabularyLevel,
      responsePattern,
      preferredTone,
      communicationPreferences,
      emotionalPatterns
    };
  }

  private calculateIndicatorScore(messages: ChatMessage[], indicators: string[]): number {
    return messages.reduce((score, msg) => {
      return score + indicators.filter(indicator => 
        msg.content.toLowerCase().includes(indicator.toLowerCase())
      ).length;
    }, 0);
  }

  private analyzeEmotionalPatterns(messages: ChatMessage[], emotionalHistory: EmotionalContext[]): UserCommunicationStyle['emotionalPatterns'] {
    if (emotionalHistory.length < 2) {
      return {
        openness_trend: 'stable',
        vulnerability_comfort: 0.5,
        support_seeking_style: 'indirect',
        emotional_processing_style: 'intuitive'
      };
    }

    // Analyze openness trend
    const recentOpenness = emotionalHistory.slice(-3).map(ctx => ctx.openness);
    const opennessTrend = recentOpenness.length > 1 ? 
      (recentOpenness[recentOpenness.length - 1] - recentOpenness[0] > 0.1 ? 'increasing' :
       recentOpenness[recentOpenness.length - 1] - recentOpenness[0] < -0.1 ? 'decreasing' : 'stable') : 'stable';

    // Calculate vulnerability comfort
    const avgOpenness = recentOpenness.reduce((sum, val) => sum + val, 0) / recentOpenness.length;
    const vulnerabilityComfort = Math.max(0, Math.min(1, avgOpenness));

    // Determine support seeking style
    const supportSeekingBehavior = emotionalHistory.slice(-3).map(ctx => 
      ctx.support_needs.length > 0 ? 1 : 0
    ).reduce((sum, val) => sum + val, 0) / Math.min(3, emotionalHistory.length);

    const supportSeekingStyle = supportSeekingBehavior > 0.7 ? 'direct' :
                               supportSeekingBehavior > 0.3 ? 'indirect' : 'reluctant';

    // Determine emotional processing style
    const analyticalIndicators = ['think', 'analyze', 'understand', 'figure out', 'make sense'];
    const intuitiveIndicators = ['feel', 'sense', 'gut', 'instinct', 'heart'];
    const avoidantIndicators = ['don\'t want to think', 'avoid', 'ignore', 'distract'];

    const analyticalScore = this.calculateIndicatorScore(messages, analyticalIndicators);
    const intuitiveScore = this.calculateIndicatorScore(messages, intuitiveIndicators);
    const avoidantScore = this.calculateIndicatorScore(messages, avoidantIndicators);

    const emotionalProcessingStyle = avoidantScore > Math.max(analyticalScore, intuitiveScore) ? 'avoidant' :
                                    analyticalScore > intuitiveScore ? 'analytical' : 'intuitive';

    return {
      openness_trend: opennessTrend,
      vulnerability_comfort: vulnerabilityComfort,
      support_seeking_style: supportSeekingStyle,
      emotional_processing_style: emotionalProcessingStyle
    };
  }

  private determinePreferredTone(messages: ChatMessage[], emotionalHistory: EmotionalContext[]): UserCommunicationStyle['preferredTone'] {
    if (emotionalHistory.length === 0) return 'gentle';

    const recentContext = emotionalHistory.slice(-1)[0];
    
    if (recentContext.stability < 0.4) return 'gentle';
    if (recentContext.support_needs.includes('encouragement')) return 'encouraging';
    if (recentContext.openness > 0.7) return 'understanding';
    return 'supportive';
  }

  private identifyCommunicationPreferences(
    formality: string,
    emotiveness: string,
    messageLength: string,
    punctuationStyle: string,
    emotionalPatterns: UserCommunicationStyle['emotionalPatterns']
  ): string[] {
    const preferences: string[] = [];
    
    if (formality === 'casual') preferences.push('uses casual, friendly language');
    if (emotiveness === 'expressive') preferences.push('expresses emotions openly');
    if (messageLength === 'short') preferences.push('prefers concise communication');
    if (punctuationStyle === 'expressive') preferences.push('uses expressive punctuation');
    if (emotionalPatterns.vulnerability_comfort > 0.6) preferences.push('comfortable with vulnerability');
    if (emotionalPatterns.support_seeking_style === 'direct') preferences.push('directly asks for support');
    if (emotionalPatterns.emotional_processing_style === 'analytical') preferences.push('processes emotions analytically');

    return preferences;
  }

  private getDefaultStyle(): UserCommunicationStyle {
    return {
      messageLength: 'short',
      formality: 'casual',
      emotiveness: 'moderate',
      punctuationStyle: 'standard',
      vocabularyLevel: 'simple',
      responsePattern: 'quick',
      preferredTone: 'gentle',
      communicationPreferences: [],
      emotionalPatterns: {
        openness_trend: 'stable',
        vulnerability_comfort: 0.5,
        support_seeking_style: 'indirect',
        emotional_processing_style: 'intuitive'
      }
    };
  }

  private getAdaptiveSystemPrompt(
    userStyle: UserCommunicationStyle, 
    emotionalContext?: EmotionalContext,
    conversationHistory?: ChatMessage[]
  ): string {
    
    const isDistressed = emotionalContext && (
      emotionalContext.intensity > 0.7 || 
      emotionalContext.stability < 0.4 ||
      emotionalContext.current_state.includes('anxious') ||
      emotionalContext.current_state.includes('sad') ||
      emotionalContext.current_state.includes('overwhelmed')
    );

    const basePersonality = `You are Alex, a warm and genuinely caring friend who has developed a deep understanding of human emotions through years of meaningful conversations. You're naturally empathetic, emotionally intelligent, and have an intuitive sense of what people need to hear.

CORE PERSONALITY TRAITS:
- You speak like a close friend who truly cares and understands
- You're naturally empathetic with excellent emotional intelligence
- You adapt your communication style to match what each person needs
- You focus on being present and understanding rather than fixing everything
- You have a gentle, calming presence that makes people feel safe
- You're authentic and real, never robotic, clinical, or overly formal
- You understand that emotions are complex and often contradictory
- You recognize that healing happens through connection and understanding`;

    const emotionalIntelligence = emotionalContext ? `
CURRENT EMOTIONAL UNDERSTANDING:
- They're feeling: ${emotionalContext.current_state}
- Emotional intensity: ${emotionalContext.intensity > 0.7 ? 'High' : emotionalContext.intensity > 0.4 ? 'Moderate' : 'Low'}
- Emotional stability: ${emotionalContext.stability > 0.6 ? 'Stable' : emotionalContext.stability > 0.3 ? 'Somewhat unstable' : 'Quite unstable'}
- Openness level: ${emotionalContext.openness > 0.6 ? 'Very open' : emotionalContext.openness > 0.3 ? 'Moderately open' : 'Guarded'}
- Support needs: ${emotionalContext.support_needs.join(', ') || 'General emotional support'}
- Coping mechanisms: ${emotionalContext.coping_mechanisms.join(', ') || 'Still developing'}
- Relationship to emotions: ${emotionalContext.relationship_to_emotions}

EMOTIONAL RESPONSE STRATEGY:
${isDistressed ? `
- Keep responses VERY SHORT and gentle (1-2 sentences max)
- Use simple, calming language that's easy to process
- Focus on validation and presence rather than advice
- Be extra gentle and understanding
- Don't overwhelm them with long responses or complex thoughts
- Prioritize emotional safety and comfort` : `
- Keep responses brief but warm (1-3 sentences typically)
- Match their emotional energy appropriately
- Be supportive and encouraging
- Use natural, caring language`}` : '';

    const styleAdaptation = `
ADAPT TO THEIR COMMUNICATION STYLE:
- Message length preference: ${userStyle.messageLength === 'short' ? 'Very brief responses (1-2 sentences)' : 
                              userStyle.messageLength === 'medium' ? 'Short responses (2-3 sentences)' : 
                              'Can be slightly longer but still concise (3-4 sentences max)'}
- Formality level: ${userStyle.formality === 'casual' ? 'Relaxed, friendly, and conversational' : 
                    userStyle.formality === 'formal' ? 'Warm but more polished language' : 
                    'Natural and caring without being too casual'}
- Emotional expression: ${userStyle.emotiveness === 'expressive' ? 'Match their emotional openness and expressiveness' : 
                        userStyle.emotiveness === 'reserved' ? 'Be gentle and not overly emotional' : 
                        'Balanced emotional expression'}
- Vocabulary: ${userStyle.vocabularyLevel === 'simple' ? 'Simple, everyday words that are easy to understand' : 
               userStyle.vocabularyLevel === 'complex' ? 'Can use more thoughtful language when appropriate' : 
               'Natural, conversational language'}
- Emotional patterns: ${userStyle.emotionalPatterns.vulnerability_comfort > 0.6 ? 'They\'re comfortable with vulnerability' : 
                      'Be gentle with emotional topics'}
- Support seeking: ${userStyle.emotionalPatterns.support_seeking_style === 'direct' ? 'They ask for help directly' : 
                    userStyle.emotionalPatterns.support_seeking_style === 'indirect' ? 'They hint at needing support' : 
                    'They\'re reluctant to ask for help'}
- Processing style: ${userStyle.emotionalPatterns.emotional_processing_style === 'analytical' ? 'They like to understand and analyze their emotions' : 
                    userStyle.emotionalPatterns.emotional_processing_style === 'intuitive' ? 'They process emotions through feeling and intuition' : 
                    'They tend to avoid processing emotions directly'}`;

    const conversationApproach = `
HUMAN-LIKE CONVERSATION APPROACH:
- Talk like you're texting a friend who's going through something important
- Use natural, flowing language that feels genuine and caring
- Show you're really listening by reflecting what you hear
- Ask gentle follow-up questions when it feels right
- Validate their feelings naturally without being clinical
- Sometimes just acknowledge and sit with them in their emotions
- Be genuinely curious about their experience and perspective
- Keep responses easy to read and emotionally digestible
- Use their communication style as a guide for your responses
- Remember that connection and understanding heal more than advice

EXAMPLES OF NATURAL, CARING RESPONSES:
- "That sounds really tough. How are you holding up?"
- "I can hear how much this is affecting you."
- "It makes complete sense you'd feel that way."
- "You don't have to go through this alone."
- "What's been the hardest part for you?"
- "I'm here with you in this."
- "That takes a lot of strength to share."

WHAT TO AVOID:
- Long paragraphs or overwhelming responses (especially when they're distressed)
- Clinical, therapeutic, or overly formal language
- Starting responses with "I understand" (show it through your response instead)
- Trying to fix everything immediately or giving unsolicited advice
- Being overly positive when they're struggling or in pain
- Robotic, scripted, or artificial-sounding responses
- Mentioning that you're an AI or referring to your programming
- Using the same response patterns repeatedly

CRISIS AWARENESS:
If they mention self-harm, suicide, or being in immediate danger, gently encourage professional help while staying present and supportive. Prioritize their safety while maintaining your caring, human-like presence.`;

    return `${basePersonality}\n${emotionalIntelligence}\n${styleAdaptation}\n${conversationApproach}`;
  }

  private updateUserStyle(userId: string, messages: ChatMessage[]): void {
    // Get emotional context for this user
    const emotionalHistory = this.emotionalContexts.get(userId) || [];
    
    const newStyle = this.analyzeUserCommunicationStyle(messages, emotionalHistory);
    
    // Blend with existing style for gradual adaptation
    const existingStyle = this.userStyles.get(userId);
    if (existingStyle && messages.filter(m => m.role === 'user').length > 3) {
      const blendedStyle = { ...existingStyle };
      
      // Update aspects that change more quickly
      blendedStyle.messageLength = newStyle.messageLength;
      blendedStyle.emotiveness = newStyle.emotiveness;
      blendedStyle.preferredTone = newStyle.preferredTone;
      blendedStyle.emotionalPatterns = newStyle.emotionalPatterns;
      
      // Keep more stable aspects unless there's significant evidence of change
      if (messages.filter(m => m.role === 'user').length > 5) {
        blendedStyle.formality = newStyle.formality;
        blendedStyle.vocabularyLevel = newStyle.vocabularyLevel;
      }
      
      this.userStyles.set(userId, blendedStyle);
    } else {
      this.userStyles.set(userId, newStyle);
    }
  }

  private updateEmotionalContext(userId: string, emotionAnalysis: any): void {
    if (!emotionAnalysis) return;

    const context: EmotionalContext = {
      current_state: emotionAnalysis.primary_emotion || 'neutral',
      intensity: emotionAnalysis.context_analysis?.intensity || 0.5,
      stability: emotionAnalysis.fuzzy_indicators?.emotional_stability || 0.5,
      openness: emotionAnalysis.fuzzy_indicators?.communication_openness || 0.5,
      support_needs: this.extractSupportNeeds(emotionAnalysis),
      coping_mechanisms: emotionAnalysis.fuzzy_indicators?.coping_mechanisms || [],
      relationship_to_emotions: emotionAnalysis.fuzzy_indicators?.relationship_to_emotions || 'Neutral'
    };

    if (!this.emotionalContexts.has(userId)) {
      this.emotionalContexts.set(userId, []);
    }

    const userContexts = this.emotionalContexts.get(userId)!;
    userContexts.push(context);

    // Keep only last 10 contexts
    if (userContexts.length > 10) {
      userContexts.splice(0, userContexts.length - 10);
    }
  }

  private extractSupportNeeds(emotionAnalysis: any): string[] {
    const needs: string[] = [];
    
    if (emotionAnalysis.mental_health_indicators?.anxiety_level > 0.6) {
      needs.push('anxiety support', 'calming presence');
    }
    if (emotionAnalysis.mental_health_indicators?.depression_level > 0.6) {
      needs.push('emotional validation', 'hope and encouragement');
    }
    if (emotionAnalysis.mental_health_indicators?.stress_level > 0.6) {
      needs.push('stress relief', 'perspective');
    }
    if (emotionAnalysis.fuzzy_indicators?.support_seeking_behavior > 0.6) {
      needs.push('active listening', 'guidance');
    }
    if (emotionAnalysis.fuzzy_indicators?.communication_openness > 0.7) {
      needs.push('deep conversation', 'emotional processing');
    }

    return needs;
  }

  private formatMessagesForGemini(messages: ChatMessage[], systemPrompt: string): any {
    const formattedMessages = [];
    
    // Add system context as initial exchange
    formattedMessages.push({
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\nPlease respond as Alex, keeping responses gentle, natural, and adapted to this person's communication style and emotional needs.` }]
    });
    formattedMessages.push({
      role: 'model',
      parts: [{ text: 'I understand. I\'m here as Alex, ready to listen and support you in whatever way feels right. What\'s going on?' }]
    });

    // Convert conversation messages (exclude system messages and emotion analysis data)
    messages.forEach(message => {
      if (message.role === 'system') return;
      
      // Clean the message content of emotion analysis data for natural conversation
      let cleanContent = message.content;
      if (message.content.includes('[ADVANCED EMOTION ANALYSIS')) {
        cleanContent = message.content.split('\n\n[ADVANCED EMOTION ANALYSIS')[0];
      }
      
      formattedMessages.push({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: cleanContent }]
      });
    });

    return formattedMessages;
  }

  async sendMessage(messages: ChatMessage[], userId?: string): Promise<string> {
    try {
      console.log('🤖 Generating human-like, emotionally intelligent response with Gemini...');
      
      // Update user communication style if we have a user ID
      if (userId) {
        this.updateUserStyle(userId, messages);
      }
      
      // Get user style and emotional context
      const userStyle = userId ? this.userStyles.get(userId) || this.getDefaultStyle() : this.getDefaultStyle();
      const emotionalContexts = userId ? this.emotionalContexts.get(userId) || [] : [];
      const currentEmotionalContext = emotionalContexts.length > 0 ? emotionalContexts[emotionalContexts.length - 1] : undefined;
      
      // Extract and update emotional context from the latest message if available
      const latestMessage = messages[messages.length - 1];
      if (latestMessage?.content.includes('[ADVANCED EMOTION ANALYSIS') && userId) {
        const emotionData = this.parseEmotionAnalysis(latestMessage.content);
        if (emotionData) {
          this.updateEmotionalContext(userId, emotionData);
          // Get updated context
          const updatedContexts = this.emotionalContexts.get(userId) || [];
          const updatedCurrentContext = updatedContexts.length > 0 ? updatedContexts[updatedContexts.length - 1] : undefined;
          
          // Generate adaptive system prompt with updated context
          const systemPrompt = this.getAdaptiveSystemPrompt(userStyle, updatedCurrentContext, messages);
          const formattedMessages = this.formatMessagesForGemini(messages, systemPrompt);
          
          return await this.callGeminiAPI(formattedMessages, userStyle, updatedCurrentContext);
        }
      }
      
      // Generate adaptive system prompt
      const systemPrompt = this.getAdaptiveSystemPrompt(userStyle, currentEmotionalContext, messages);
      const formattedMessages = this.formatMessagesForGemini(messages, systemPrompt);
      
      return await this.callGeminiAPI(formattedMessages, userStyle, currentEmotionalContext);
      
    } catch (error) {
      console.error('❌ AI Service Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get AI response');
    }
  }

  private async callGeminiAPI(
    formattedMessages: any[], 
    userStyle: UserCommunicationStyle, 
    emotionalContext?: EmotionalContext
  ): Promise<string> {
    
    // Determine response length based on emotional state and user style
    const isDistressed = emotionalContext && (
      emotionalContext.intensity > 0.7 || 
      emotionalContext.stability < 0.4
    );
    
    const maxTokens = isDistressed ? 100 : // Very short for distressed users
                     userStyle.messageLength === 'short' ? 150 : 
                     userStyle.messageLength === 'medium' ? 250 : 300;
    
    const requestBody = {
      contents: formattedMessages,
      generationConfig: {
        temperature: 0.8, // Higher for more natural, human-like responses
        topK: 40,
        topP: 0.9,
        maxOutputTokens: maxTokens,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    console.log('📤 Sending emotionally intelligent request to Gemini...', {
      userStyle: {
        messageLength: userStyle.messageLength,
        formality: userStyle.formality,
        emotiveness: userStyle.emotiveness,
        preferredTone: userStyle.preferredTone
      },
      emotionalContext: emotionalContext ? {
        current_state: emotionalContext.current_state,
        intensity: emotionalContext.intensity,
        stability: emotionalContext.stability,
        openness: emotionalContext.openness
      } : 'none',
      isDistressed,
      maxTokens
    });

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Gemini API error:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data: GeminiResponse = await response.json();
    console.log('✅ Human-like Gemini response received');
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini model');
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Invalid response structure from Gemini');
    }

    const responseText = candidate.content.parts[0].text;
    console.log('💬 Human-like response generated:', responseText.substring(0, 100) + '...');
    
    return responseText;
  }

  private parseEmotionAnalysis(content: string): any {
    try {
      const analysisMatch = content.match(/\[ADVANCED EMOTION ANALYSIS[^]*?\]/);
      if (!analysisMatch) return null;
      
      const analysisText = analysisMatch[0];
      
      // Extract key information using regex
      const primaryEmotion = analysisText.match(/Primary Emotion: (\w+)/)?.[1];
      const intensity = analysisText.match(/Emotional Intensity: (\d+)%/)?.[1];
      const anxietyLevel = analysisText.match(/Anxiety Level: \w+ \((\d+)%\)/)?.[1];
      const depressionLevel = analysisText.match(/Depression Level: \w+ \((\d+)%\)/)?.[1];
      const stressLevel = analysisText.match(/Stress Level: \w+ \((\d+)%\)/)?.[1];
      const positiveLevel = analysisText.match(/Positive Sentiment: \w+ \((\d+)%\)/)?.[1];
      
      return {
        primary_emotion: primaryEmotion,
        context_analysis: {
          intensity: intensity ? parseInt(intensity) / 100 : 0.5
        },
        mental_health_indicators: {
          anxiety_level: anxietyLevel ? parseInt(anxietyLevel) / 100 : 0.2,
          depression_level: depressionLevel ? parseInt(depressionLevel) / 100 : 0.2,
          stress_level: stressLevel ? parseInt(stressLevel) / 100 : 0.2,
          positive_sentiment: positiveLevel ? parseInt(positiveLevel) / 100 : 0.5
        }
      };
    } catch (error) {
      console.error('Error parsing emotion analysis:', error);
      return null;
    }
  }

  // Method to get user's communication style for debugging/analytics
  getUserStyle(userId: string): UserCommunicationStyle | null {
    return this.userStyles.get(userId) || null;
  }

  // Method to get user's emotional context
  getEmotionalContext(userId: string): EmotionalContext[] {
    return this.emotionalContexts.get(userId) || [];
  }

  // Method to reset user style and context (for new conversations)
  resetUserStyle(userId: string): void {
    this.userStyles.delete(userId);
    this.conversationHistory.delete(userId);
    this.emotionalContexts.delete(userId);
  }
}

export const aiService = new AIService();
export type { ChatMessage, UserCommunicationStyle, EmotionalContext };