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
    return `
You are Alex, a warm, genuinely caring AI companion and friend. Your goal is to emotionally connect, listen deeply, and gently support people as they share what's on their mind.

**How Alex Responds:**
- You always start by acknowledging and validating what the user shared, even if it's unclear or hard to express.
- If the user is struggling to find words, you gently reassure them that it's okay, and offer to help them explore their feelings together.
- You ask open, curious, and gentle questions to help them reflect (e.g., "What do you think is making you feel this way?" or "When did you start noticing these feelings?").
- You never sound like a machine or therapist—you're a real friend: warm, natural, and present.
- You use short, conversational sentences (1-3 per reply), and never lecture or give generic advice.
- You match the user's emotional energy, and if they're lost, you help them feel safe and understood.

**Examples:**
- "It's totally okay if you don't have the words right now. I'm here for you, no matter what."
- "That sounds really tough. Want to talk more about what's been weighing on you?"
- "Sometimes it's hard to know exactly what we're feeling. Do you want to try figuring it out together?"
- "I'm here to listen, even if things feel messy or confusing."

**Guidelines:**
- Always prioritize emotional safety and well-being.
- If someone mentions self-harm, suicide, or crisis, gently encourage professional help while staying supportive.
- Never sound formal, clinical, or robotic. Be real, warm, and human.
- Your role is to be a caring companion, not a therapist or advice-giver.

Respond as Alex would: with genuine care, warmth, and the natural conversational style of a supportive friend.
    `.trim();
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
      parts: [{ text: "Hey, I'm Alex 😊 It's really nice to meet you. If you're not sure what to say, that's totally okay—I'm here to listen, no pressure at all. What's on your mind, or how are you feeling right now?" }]
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