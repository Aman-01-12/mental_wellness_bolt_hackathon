interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

class AIService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private model = 'qwen/qwen-2.5-72b-instruct';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured');
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

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    try {
      const systemMessage: ChatMessage = {
        role: 'system',
        content: this.getSystemPrompt()
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MindSpace AI Companion'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [systemMessage, ...messages],
          temperature: 0.7,
          max_tokens: 800,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI model');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get AI response');
    }
  }
}

export const aiService = new AIService();
export type { ChatMessage };