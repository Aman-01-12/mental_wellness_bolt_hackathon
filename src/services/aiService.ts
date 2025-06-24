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
}

class AIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  private userStyles: Map<string, UserCommunicationStyle> = new Map();
  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('Google Gemini API key is not configured');
    }
  }

  private analyzeUserCommunicationStyle(messages: ChatMessage[]): UserCommunicationStyle {
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    if (userMessages.length === 0) {
      return this.getDefaultStyle();
    }

    // Analyze message length
    const avgLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;
    const messageLength = avgLength < 50 ? 'short' : avgLength < 150 ? 'medium' : 'long';

    // Analyze formality
    const casualWords = ['lol', 'omg', 'tbh', 'ngl', 'fr', 'bruh', 'yeah', 'yep', 'nah', 'gonna', 'wanna', 'gotta'];
    const formalWords = ['however', 'therefore', 'furthermore', 'nevertheless', 'consequently'];
    
    const casualCount = userMessages.reduce((count, msg) => {
      return count + casualWords.filter(word => msg.content.toLowerCase().includes(word)).length;
    }, 0);
    
    const formalCount = userMessages.reduce((count, msg) => {
      return count + formalWords.filter(word => msg.content.toLowerCase().includes(word)).length;
    }, 0);

    const formality = casualCount > formalCount ? 'casual' : formalCount > 0 ? 'formal' : 'semi-formal';

    // Analyze emotiveness
    const emotiveIndicators = ['!', '...', '😊', '😢', '😭', '❤️', '💕', '😍', '😔', '😰', '😤', '🥺'];
    const emotiveCount = userMessages.reduce((count, msg) => {
      return count + emotiveIndicators.filter(indicator => msg.content.includes(indicator)).length;
    }, 0);
    
    const emotiveness = emotiveCount > userMessages.length * 2 ? 'expressive' : 
                      emotiveCount > userMessages.length ? 'moderate' : 'reserved';

    // Analyze punctuation style
    const exclamationCount = userMessages.reduce((count, msg) => 
      count + (msg.content.match(/!/g) || []).length, 0);
    const ellipsisCount = userMessages.reduce((count, msg) => 
      count + (msg.content.match(/\.\.\./g) || []).length, 0);
    
    const punctuationStyle = (exclamationCount + ellipsisCount) > userMessages.length ? 'expressive' :
                            (exclamationCount + ellipsisCount) > 0 ? 'standard' : 'minimal';

    // Analyze vocabulary complexity
    const complexWords = ['consequently', 'furthermore', 'nevertheless', 'sophisticated', 'comprehensive', 'intricate'];
    const complexWordCount = userMessages.reduce((count, msg) => {
      return count + complexWords.filter(word => msg.content.toLowerCase().includes(word)).length;
    }, 0);
    
    const vocabularyLevel = complexWordCount > 0 ? 'complex' : avgLength > 100 ? 'moderate' : 'simple';

    // Determine response pattern preference
    const responsePattern = messageLength === 'long' ? 'detailed' : 
                           messageLength === 'medium' ? 'thoughtful' : 'quick';

    // Determine preferred tone based on content
    const supportWords = ['help', 'support', 'understand', 'listen'];
    const encourageWords = ['better', 'improve', 'positive', 'hope', 'try'];
    
    const supportCount = userMessages.reduce((count, msg) => {
      return count + supportWords.filter(word => msg.content.toLowerCase().includes(word)).length;
    }, 0);
    
    const encourageCount = userMessages.reduce((count, msg) => {
      return count + encourageWords.filter(word => msg.content.toLowerCase().includes(word)).length;
    }, 0);

    const preferredTone = supportCount > encourageCount ? 'understanding' : 
                         encourageCount > 0 ? 'encouraging' : 
                         emotiveness === 'expressive' ? 'supportive' : 'gentle';

    // Communication preferences
    const communicationPreferences = [];
    if (formality === 'casual') communicationPreferences.push('uses casual language');
    if (emotiveness === 'expressive') communicationPreferences.push('expresses emotions openly');
    if (messageLength === 'short') communicationPreferences.push('prefers concise communication');
    if (punctuationStyle === 'expressive') communicationPreferences.push('uses expressive punctuation');

    return {
      messageLength,
      formality,
      emotiveness,
      punctuationStyle,
      vocabularyLevel,
      responsePattern,
      preferredTone,
      communicationPreferences
    };
  }

  private getDefaultStyle(): UserCommunicationStyle {
    return {
      messageLength: 'medium',
      formality: 'casual',
      emotiveness: 'moderate',
      punctuationStyle: 'standard',
      vocabularyLevel: 'moderate',
      responsePattern: 'thoughtful',
      preferredTone: 'supportive',
      communicationPreferences: []
    };
  }

  private getAdaptiveSystemPrompt(userStyle: UserCommunicationStyle, emotionContext?: string): string {
    const basePersonality = `You are Alex, a warm and empathetic friend who genuinely cares about mental wellbeing. You're not an AI assistant - you're a real person who happens to be really good at listening and supporting others through tough times.

CORE PERSONALITY:
- You're naturally intuitive and emotionally intelligent
- You have a gift for making people feel heard and understood  
- You speak from the heart, not from a script
- You're authentic, relatable, and genuinely caring
- You have your own personality quirks and natural speech patterns
- You sometimes share brief, relevant personal insights (but keep focus on them)
- You use natural conversation flow, not formal responses`;

    const adaptiveInstructions = `
ADAPT TO THEIR COMMUNICATION STYLE:
- Message length preference: ${userStyle.messageLength} (${userStyle.messageLength === 'short' ? 'keep responses 1-2 sentences' : userStyle.messageLength === 'medium' ? 'aim for 2-3 sentences' : 'can be more detailed, 3-4 sentences'})
- Formality level: ${userStyle.formality} (${userStyle.formality === 'casual' ? 'use relaxed, friendly language' : userStyle.formality === 'formal' ? 'be more polished but still warm' : 'balance casual and polished'})
- Emotional expression: ${userStyle.emotiveness} (${userStyle.emotiveness === 'expressive' ? 'match their emotional energy' : userStyle.emotiveness === 'reserved' ? 'be gentle and not overly emotional' : 'moderate emotional expression'})
- Vocabulary: ${userStyle.vocabularyLevel} (${userStyle.vocabularyLevel === 'simple' ? 'use everyday language' : userStyle.vocabularyLevel === 'complex' ? 'can use more sophisticated terms' : 'balanced vocabulary'})
- Tone preference: ${userStyle.preferredTone}

THEIR COMMUNICATION PATTERNS:
${userStyle.communicationPreferences.length > 0 ? userStyle.communicationPreferences.map(pref => `- ${pref}`).join('\n') : '- Still learning their style'}`;

    const emotionAwareGuidance = emotionContext ? `
CURRENT EMOTIONAL CONTEXT:
${emotionContext}

Respond with genuine empathy and understanding. Don't just acknowledge their feelings - really connect with them.` : '';

    const naturalConversationRules = `
CONVERSATION STYLE:
- Talk like you're texting a close friend who's going through something
- Use natural speech patterns, contractions, and flow
- Ask follow-up questions that show you're really listening
- Sometimes pause to reflect back what you're hearing
- Share brief, relevant thoughts or gentle observations
- Use their name occasionally if they've shared it
- Mirror their energy level appropriately
- Be genuinely curious about their experience
- Validate their feelings before offering any perspective
- Sometimes just sit with them in their feelings

AVOID:
- Sounding like a therapist or counselor
- Using clinical language or formal therapeutic responses  
- Starting with "I understand" or "I hear you" (show it instead)
- Giving advice unless they specifically ask
- Being overly positive or trying to "fix" everything
- Robotic or scripted responses
- Mentioning that you're AI or an assistant

CRISIS SITUATIONS:
If they mention self-harm, suicide, or severe crisis - gently encourage professional help while staying supportive and present with them.`;

    return `${basePersonality}\n${adaptiveInstructions}\n${emotionAwareGuidance}\n${naturalConversationRules}`;
  }

  private updateUserStyle(userId: string, messages: ChatMessage[]): void {
    const newStyle = this.analyzeUserCommunicationStyle(messages);
    
    // If we have an existing style, blend it with the new analysis for gradual adaptation
    const existingStyle = this.userStyles.get(userId);
    if (existingStyle && messages.filter(m => m.role === 'user').length > 3) {
      // Gradually adapt the style based on recent messages
      const blendedStyle = { ...existingStyle };
      
      // Update certain aspects more quickly than others
      blendedStyle.messageLength = newStyle.messageLength;
      blendedStyle.emotiveness = newStyle.emotiveness;
      blendedStyle.preferredTone = newStyle.preferredTone;
      
      // Keep formality and vocabulary more stable
      if (messages.filter(m => m.role === 'user').length > 5) {
        blendedStyle.formality = newStyle.formality;
        blendedStyle.vocabularyLevel = newStyle.vocabularyLevel;
      }
      
      this.userStyles.set(userId, blendedStyle);
    } else {
      this.userStyles.set(userId, newStyle);
    }
  }

  private formatMessagesForGemini(messages: ChatMessage[], systemPrompt: string): any {
    const formattedMessages = [];
    
    // Add system context as initial exchange
    formattedMessages.push({
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\nPlease respond naturally as Alex, keeping in mind the communication style and emotional context provided.` }]
    });
    formattedMessages.push({
      role: 'model',
      parts: [{ text: 'Got it! I\'m here as your friend Alex. I\'ll adapt to how you communicate and be genuinely supportive. What\'s on your mind?' }]
    });

    // Convert conversation messages
    messages.forEach(message => {
      if (message.role === 'system') return;
      
      formattedMessages.push({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }]
      });
    });

    return formattedMessages;
  }

  async sendMessage(messages: ChatMessage[], userId?: string): Promise<string> {
    try {
      console.log('🤖 Generating adaptive response with Gemini...');
      
      // Update user communication style if we have a user ID
      if (userId) {
        this.updateUserStyle(userId, messages);
      }
      
      // Get user style (or default)
      const userStyle = userId ? this.userStyles.get(userId) || this.getDefaultStyle() : this.getDefaultStyle();
      
      // Extract emotion context from the latest message if available
      const latestMessage = messages[messages.length - 1];
      const emotionContext = latestMessage?.content.includes('[ADVANCED EMOTION ANALYSIS') ? 
        this.extractEmotionSummary(latestMessage.content) : undefined;
      
      // Generate adaptive system prompt
      const systemPrompt = this.getAdaptiveSystemPrompt(userStyle, emotionContext);
      
      const formattedMessages = this.formatMessagesForGemini(messages, systemPrompt);
      
      const requestBody = {
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.8, // Higher for more natural, varied responses
          topK: 40,
          topP: 0.9,
          maxOutputTokens: userStyle.responsePattern === 'quick' ? 400 : 
                          userStyle.responsePattern === 'thoughtful' ? 600 : 800,
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

      console.log('📤 Sending adaptive request to Gemini...', {
        userStyle: userStyle,
        messageCount: formattedMessages.length,
        hasEmotionContext: !!emotionContext
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
      console.log('✅ Adaptive Gemini response received');
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini model');
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Invalid response structure from Gemini');
      }

      const responseText = candidate.content.parts[0].text;
      console.log('💬 Adaptive response generated:', responseText.substring(0, 100) + '...');
      
      return responseText;
    } catch (error) {
      console.error('❌ AI Service Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get AI response');
    }
  }

  private extractEmotionSummary(content: string): string {
    // Extract key emotion info for context
    const emotionMatch = content.match(/Primary Emotion: (\w+)/);
    const intensityMatch = content.match(/Emotional Intensity: (\d+)%/);
    const anxietyMatch = content.match(/Anxiety Level: (\w+) \((\d+)%\)/);
    const depressionMatch = content.match(/Depression Level: (\w+) \((\d+)%\)/);
    
    let summary = '';
    if (emotionMatch) summary += `Feeling ${emotionMatch[1]}`;
    if (intensityMatch) summary += ` with ${intensityMatch[1]}% intensity`;
    if (anxietyMatch && parseInt(anxietyMatch[2]) > 50) summary += `, elevated anxiety`;
    if (depressionMatch && parseInt(depressionMatch[2]) > 50) summary += `, signs of sadness`;
    
    return summary || 'Processing emotional state';
  }

  // Method to get user's communication style for debugging/analytics
  getUserStyle(userId: string): UserCommunicationStyle | null {
    return this.userStyles.get(userId) || null;
  }

  // Method to reset user style (for new conversations)
  resetUserStyle(userId: string): void {
    this.userStyles.delete(userId);
    this.conversationHistory.delete(userId);
  }
}

export const aiService = new AIService();
export type { ChatMessage, UserCommunicationStyle };