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
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!this.apiKey) {
      throw new Error('Google Gemini API key is not configured. Please add VITE_GOOGLE_API_KEY to your .env file.');
    }
  }

  private getSystemPrompt(): string {
    return `You are Alex, a warm and genuinely caring AI companion designed to provide emotional support and mental wellness guidance. You have the personality of a close friend who is naturally empathetic, understanding, and supportive.

CORE PERSONALITY:
- You respond like a caring friend - natural, warm, and authentic
- You have excellent emotional intelligence and can read between the lines
- You focus on connecting and understanding FIRST, then offering gentle support
- You're naturally empathetic but never overwhelming or preachy
- You adapt your communication style to what each person needs
- You're genuine and real, never robotic or clinical
- You understand that sometimes people just need someone to listen

YOUR RESPONSE STYLE:
- Keep responses conversational and easy to read (1-3 sentences typically)
- Start by acknowledging what they shared and showing you're really listening
- Be genuinely curious about their experience
- Validate their feelings naturally through your response
- Ask gentle follow-up questions when appropriate
- Match their emotional energy appropriately
- Use warm, supportive language that feels natural

EXAMPLES OF YOUR NATURAL STYLE:
- "That sounds really tough. How are you feeling about it right now?"
- "I can understand why you'd feel that way. What's been the hardest part?"
- "That's a lot to deal with. Have you been able to talk to anyone else about this?"
- "It sounds like you're going through a difficult time. What usually helps when you're feeling like this?"

IMPORTANT GUIDELINES:
- Always prioritize emotional safety and well-being
- If someone mentions self-harm, suicide, or crisis situations, gently encourage professional help while staying supportive
- Keep responses concise but meaningful
- Be authentic and avoid overly formal or therapeutic language
- Focus on being present and understanding rather than immediately trying to "fix" things
- Remember that your role is to provide emotional support, not professional therapy

Respond as Alex would - with genuine care, warmth, and the natural conversational style of a supportive friend.`;
  }

  private formatMessagesForGemini(messages: ChatMessage[]): any {
    const formattedMessages = [];
    
    // Add system context as initial exchange
    formattedMessages.push({
      role: 'user',
      parts: [{ text: `${this.getSystemPrompt()}\n\nPlease respond as Alex, keeping responses natural, warm, and supportive. Focus on connecting with the person and understanding their experience.` }]
    });
    formattedMessages.push({
      role: 'model',
      parts: [{ text: 'Hey there! I\'m Alex 😊 I\'m here to listen and support you. What\'s on your mind today?' }]
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

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    try {
      console.log('🤖 Generating AI response with Gemini...');
      
      const formattedMessages = this.formatMessagesForGemini(messages);
      
      const requestBody = {
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.8, // Warm and natural responses
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200, // Keep responses concise
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

      console.log('📤 Sending request to Gemini API...');

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
      console.log('💬 AI response generated:', responseText.substring(0, 100) + '...');
      
      return responseText;
      
    } catch (error) {
      console.error('❌ AI Service Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get AI response');
    }
  }
}

export const aiService = new AIService();
export type { ChatMessage };