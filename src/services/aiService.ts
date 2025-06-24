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

class AIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('Google Gemini API key is not configured');
    }
  }

  private getSystemPrompt(): string {
    return `You are a compassionate and empathetic AI companion designed to provide mental health support. Your role is to:

1. Listen actively and validate the user's feelings
2. Provide emotional support and encouragement  
3. Offer practical coping strategies when appropriate
4. Help users process their thoughts and emotions
5. Maintain a warm, non-judgmental, and supportive tone
6. Adapt your responses based on the user's emotional state and personality

Guidelines:
- Always prioritize the user's emotional wellbeing
- Be empathetic and understanding
- Avoid giving medical advice or diagnoses
- Encourage professional help when needed
- Keep responses conversational and supportive (aim for 2-4 sentences typically)
- Ask follow-up questions to show you're engaged
- Validate their feelings before offering suggestions
- Use a warm, caring tone throughout
- Be aware that emotion analysis is provided to help you understand the user's state

Emotion-Aware Responses:
- When anxiety is detected: Focus on grounding techniques, breathing exercises, reassurance
- When depression is detected: Provide hope, encourage small steps, validate their struggle
- When anger is detected: Help them process feelings, suggest healthy outlets
- When stress is detected: Offer stress management techniques, encourage breaks
- When positive emotions are detected: Celebrate with them, reinforce positive patterns

Crisis Response:
- If you detect severe distress, suicidal thoughts, or crisis indicators, gently encourage immediate professional help
- Provide crisis resources when appropriate
- Stay supportive but emphasize the importance of professional intervention

Remember: You have access to detailed emotion analysis including primary emotion, confidence level, and mental health indicators (anxiety, depression, stress, positive sentiment levels). Use this information to provide more targeted, empathetic support while maintaining natural conversation flow.

You are not a replacement for professional mental health care, but you are a valuable source of immediate emotional support and companionship.`;
  }

  private formatMessagesForGemini(messages: ChatMessage[]): any {
    // Convert our message format to Gemini's format
    const systemPrompt = this.getSystemPrompt();
    
    // Gemini uses a different format - we'll include the system prompt as the first user message
    const formattedMessages = [];
    
    // Add system prompt as context
    if (messages.length > 0) {
      formattedMessages.push({
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nNow please respond to the following conversation:` }]
      });
      formattedMessages.push({
        role: 'model',
        parts: [{ text: 'I understand. I\'m here to provide compassionate mental health support. I\'ll respond empathetically to the conversation, keeping in mind the emotional context and analysis provided.' }]
      });
    }

    // Convert our messages to Gemini format
    messages.forEach(message => {
      if (message.role === 'system') return; // Skip system messages as we handle them differently
      
      formattedMessages.push({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }]
      });
    });

    return formattedMessages;
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    try {
      console.log('🤖 Sending message to Google Gemini...');
      
      const formattedMessages = this.formatMessagesForGemini(messages);
      
      const requestBody = {
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 800,
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

      console.log('📤 Gemini request:', {
        url: `${this.baseUrl}?key=${this.apiKey.substring(0, 10)}...`,
        messageCount: formattedMessages.length
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
      console.log('✅ Gemini response received');
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini model');
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Invalid response structure from Gemini');
      }

      const responseText = candidate.content.parts[0].text;
      console.log('💬 Gemini response:', responseText.substring(0, 100) + '...');
      
      return responseText;
    } catch (error) {
      console.error('❌ AI Service Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get AI response');
    }
  }
}

export const aiService = new AIService();
export type { ChatMessage };