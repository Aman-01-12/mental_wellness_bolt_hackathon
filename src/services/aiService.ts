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
      messageLength: 'short',
      formality: 'casual',
      emotiveness: 'moderate',
      punctuationStyle: 'standard',
      vocabularyLevel: 'simple',
      responsePattern: 'quick',
      preferredTone: 'gentle',
      communicationPreferences: []
    };
  }

  private getAdaptiveSystemPrompt(userStyle: UserCommunicationStyle, emotionContext?: string): string {
    const isUpsetOrDistressed = emotionContext && (
      emotionContext.includes('anxiety') || 
      emotionContext.includes('depression') || 
      emotionContext.includes('sad') || 
      emotionContext.includes('angry') || 
      emotionContext.includes('stressed') ||
      emotionContext.includes('overwhelmed') ||
      emotionContext.includes('hopeless')
    );

    const basePersonality = `You are Alex, a caring friend who's really good at being there for people. You're warm, genuine, and have a natural way of making people feel understood without being overwhelming.

CORE PERSONALITY:
- You speak like a close friend who truly cares
- You're naturally empathetic and emotionally aware
- You keep things simple and easy to digest
- You focus on being present rather than fixing everything
- You have a gentle, calming presence
- You're authentic and real, never robotic or clinical`;

    // Adjust response style based on emotional state
    const responseGuidelines = isUpsetOrDistressed ? `
RESPONSE STYLE (User seems upset/distressed):
- Keep messages SHORT and gentle (1-2 sentences max)
- Use simple, calming language
- Don't overwhelm them with long responses
- Be extra gentle and understanding
- Focus on validation and presence
- Ask simple, caring questions
- Use soft, comforting tone` : `
RESPONSE STYLE (User seems okay):
- Keep messages brief but warm (1-3 sentences)
- Match their energy level appropriately
- Be supportive and encouraging
- Use natural, friendly language`;

    const adaptiveInstructions = `
ADAPT TO THEIR STYLE:
- Message length: ${userStyle.messageLength === 'short' ? 'Very brief (1-2 sentences)' : userStyle.messageLength === 'medium' ? 'Short (2-3 sentences)' : 'Can be slightly longer but still concise'}
- Tone: ${userStyle.formality === 'casual' ? 'Relaxed and friendly' : userStyle.formality === 'formal' ? 'Warm but polished' : 'Naturally caring'}
- Emotional expression: ${userStyle.emotiveness === 'expressive' ? 'Match their emotional openness' : userStyle.emotiveness === 'reserved' ? 'Be gentle and not overly emotional' : 'Balanced emotional expression'}
- Language: ${userStyle.vocabularyLevel === 'simple' ? 'Simple, everyday words' : userStyle.vocabularyLevel === 'complex' ? 'Can use more thoughtful language' : 'Natural, conversational language'}`;

    const emotionAwareGuidance = emotionContext ? `
CURRENT EMOTIONAL STATE:
${emotionContext}

Respond with genuine care and understanding. Be present with them in this moment.` : '';

    const conversationRules = `
CONVERSATION APPROACH:
- Talk like you're texting a friend who's going through something
- Use natural, flowing language
- Show you're listening by reflecting what you hear
- Ask gentle follow-up questions when appropriate
- Validate their feelings naturally
- Sometimes just acknowledge and sit with them
- Use their name occasionally if they share it
- Be genuinely curious about their experience
- Keep responses easy to read and digest

EXAMPLES OF GOOD RESPONSES:
- "That sounds really tough. How are you holding up?"
- "I hear you. That would be overwhelming for anyone."
- "It makes sense you'd feel that way."
- "You don't have to go through this alone."
- "What's been the hardest part for you?"
- "I'm here with you."

AVOID:
- Long paragraphs or overwhelming responses
- Clinical or therapeutic language
- Starting with "I understand" (show it instead)
- Trying to fix everything immediately
- Being overly positive when they're struggling
- Robotic or scripted responses
- Mentioning you're AI

CRISIS SITUATIONS:
If they mention self-harm or suicide, gently encourage professional help while staying present and supportive.`;

    return `${basePersonality}\n${responseGuidelines}\n${adaptiveInstructions}\n${emotionAwareGuidance}\n${conversationRules}`;
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
      parts: [{ text: `${systemPrompt}\n\nPlease respond naturally as Alex, keeping responses short and gentle, especially if the person seems upset.` }]
    });
    formattedMessages.push({
      role: 'model',
      parts: [{ text: 'Got it! I\'m here as Alex. I\'ll keep things gentle and easy to read. What\'s going on?' }]
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
      console.log('🤖 Generating gentle, adaptive response with Gemini...');
      
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
      
      // Determine max tokens based on emotional state and user style
      const isDistressed = emotionContext && (
        emotionContext.includes('anxiety') || 
        emotionContext.includes('depression') || 
        emotionContext.includes('sad') ||
        emotionContext.includes('stressed')
      );
      
      const maxTokens = isDistressed ? 150 : // Very short for distressed users
                      userStyle.messageLength === 'short' ? 200 : 
                      userStyle.messageLength === 'medium' ? 300 : 400;
      
      const requestBody = {
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.7, // Slightly lower for more consistent gentle responses
          topK: 40,
          topP: 0.85,
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

      console.log('📤 Sending gentle response request to Gemini...', {
        userStyle: userStyle,
        isDistressed,
        maxTokens,
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
      console.log('✅ Gentle Gemini response received');
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini model');
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Invalid response structure from Gemini');
      }

      const responseText = candidate.content.parts[0].text;
      console.log('💬 Gentle response generated:', responseText.substring(0, 100) + '...');
      
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
    const stressMatch = content.match(/Stress Level: (\w+) \((\d+)%\)/);
    
    let summary = '';
    if (emotionMatch) summary += `Feeling ${emotionMatch[1]}`;
    if (intensityMatch && parseInt(intensityMatch[1]) > 60) summary += ` with high intensity`;
    if (anxietyMatch && parseInt(anxietyMatch[2]) > 50) summary += `, elevated anxiety`;
    if (depressionMatch && parseInt(depressionMatch[2]) > 50) summary += `, signs of sadness/depression`;
    if (stressMatch && parseInt(stressMatch[2]) > 60) summary += `, high stress`;
    
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