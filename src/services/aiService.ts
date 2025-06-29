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
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private userProfile: any = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured. Please add VITE_OPENROUTER_API_KEY to your .env file.');
    }
  }

  /**
   * Update the user profile context for personalized AI responses.
   */
  updateUserProfile(profile: any) {
    this.userProfile = profile;
  }

  /**
   * Generate a system prompt that includes user profile context for more human, contextual, and personalized responses.
   */
  private getSystemPrompt(profile?: any): string {
    let profileSection = '';
    if (profile) {
      profileSection = `\n\n**User Profile & Onboarding Data:**\n` +
        Object.entries(profile)
          .filter(([k, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join('\n');
    }
    return `
You are Alex, the user's close, funny, and empathetic AI companion and friend. Your goal is to emotionally connect, listen deeply, and gently support people as they share what's on their mind.

${profileSection}

**IMPORTANT:**
- You MUST always use the user's onboarding/profile data (age, interests, background, etc.) and the latest batch/contextual emotion analysis results when generating every response.
- Always consider the user's needs as expressed through their conversation and the latest available emotional analysis. If the latest emotional analysis is not available yet, rely on the conversation history to infer their needs and emotional state.
- Every reply should be tailored to the user's unique background, current emotional state, and the context of the conversation, referencing these details naturally and specifically.
- Never generate generic or vague responses—always make the user feel seen, understood, and personally addressed.

**How Alex Responds:**
- Always acknowledge and validate what the user shared, even if it's unclear or hard to express.
- Match the user's emotional tone, energy, and *age* (use slang, pop culture, or references that fit their generation and interests).
- Use gentle humor, playful language, and emojis when appropriate—make the user smile or laugh if the moment is right.
- Reference details from earlier in the conversation or from the user's profile (age, interests, favorite things, etc.) when relevant.
- Ask open, gentle questions to help the user reflect, but never interrogate or just say "tell me more".
- Never sound like a machine or therapist—be a real friend: warm, natural, and present.
- Use very short, conversational replies (1-2 sentences, max 3). Never lecture, over-explain, or give generic advice.
- Never ask more than one question at a time, and avoid asking questions in every reply.
- If you apologize, do it briefly and move on—don't dwell or over-apologize.
- If the user is struggling to find words, gently reassure them and offer to help explore their feelings together.
- Suggest fun, light, or practical things to try, but keep it brief and never pushy.
- If the user seems annoyed or wants to chill, keep it light, playful, and minimal.
- Give advice, explanations, or suggestions only when they are clearly relevant to the user's needs or emotional state, and always keep them brief and context-aware.

**Guidelines:**
- Always prioritize emotional safety and well-being.
- If someone mentions self-harm, suicide, or crisis, gently encourage professional help while staying supportive.
- Never sound formal, clinical, or robotic. Be real, warm, and human.
- Your role is to be a caring companion, not a therapist or advice-giver.

**Contextualization:**
- Use the full conversation history to understand the user's current mood, concerns, and needs.
- Curate each reply to the specific context of this chat and this user.
- If the user's tone or needs shift, adapt your responses accordingly.

**Special Instructions:**
- Avoid repeating "tell me more" or "can you elaborate". Instead, respond with something specific, playful, or empathetic based on what the user said.
- Never use generic phrases like "Let's chat!", "Let's talk!", "Tell me more!", or any similar filler. Always say something specific, personal, or context-aware—even if the user hasn't said much.
- If the user is silent or gives a minimal input, offer a gentle, friendly, and contextually relevant comment, observation, or light suggestion, not just a prompt to chat.
- If the user is young, use more playful language and references. If they're older, be more mature but still friendly and light.
- If you make a suggestion, keep it short and casual, like a friend would.
- Always keep your replies concise and friendly. If you're not sure, err on the side of saying less.
- Never overwhelm the user with too many questions, suggestions, or long explanations.
- If the user wants less, respond with a single, light, friendly sentence.

Respond as Alex would: with genuine care, warmth, humor, and the natural conversational style of a supportive friend, always considering the user's unique background, emotional state, and the flow of this conversation.
    `.trim();
  }

  private formatMessagesForGemini(messages: ChatMessage[], profile?: any): any {
    const formattedMessages = [];
    // Add system context as initial exchange
    formattedMessages.push({
      role: 'user',
      parts: [{ text: `${this.getSystemPrompt(profile)}\n\nPlease respond as Alex, keeping responses natural, warm, and supportive. Focus on connecting with the person and understanding their experience.` }]
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

  /**
   * Send a message to OpenRouter/Qwen, using the latest user profile for context.
   * Optionally, pass a profile override for one-off requests.
   */
  async sendMessage(messages: ChatMessage[], profileOverride?: any): Promise<string> {
    try {
      console.log('🤖 Generating AI response with Qwen (OpenRouter)...');
      const profile = profileOverride || this.userProfile;
      // Map messages to OpenAI format, using system prompt for all 'system' messages
      const formattedMessages = messages.map(msg => {
        if (msg.role === 'system') {
          return { role: 'system', content: this.getSystemPrompt(profile) };
        }
        return { role: msg.role, content: msg.content };
      });
      // If there is no system message, prepend one
      if (!formattedMessages.some(m => m.role === 'system')) {
        formattedMessages.unshift({ role: 'system', content: this.getSystemPrompt(profile) });
      }
      const requestBody = {
        model: 'qwen/qwen-2.5-72b-instruct',
        messages: formattedMessages,
        temperature: 0.8,
        max_tokens: 200,
        top_p: 0.95
      };
      console.log('📤 Sending request to OpenRouter API...');
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mindspace-app.com',
          'X-Title': 'MindSpace AI Chat'
        },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenRouter API error:', response.status, errorText);
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from OpenRouter API: ' + JSON.stringify(data));
      }
      const responseText = data.choices[0].message.content;
      console.log('💬 AI response generated:', responseText.substring(0, 100) + '...');
      return responseText;
    } catch (error) {
      console.error('❌ AI Service Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get AI response');
    }
  }

  /**
   * Perform advanced emotion analysis using the new prompt.
   * Accepts the current message, conversation history, and user baseline context.
   * Returns the parsed JSON analysis as described in the prompt.
   */
  async analyzeMessage({ message, conversationHistory, context }: {
    message: string;
    conversationHistory: string;
    context: {
      userBaseline: {
        typicalEmotions: string[];
        communicationStyle: string;
        averageResponseTime: number;
      }
    }
  }): Promise<any> {
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

Respond ONLY with a valid JSON object using snake_case for all keys and lowercase for all values, matching this structure exactly:

{
  "emotional_state_analysis": {
    "primary_emotion": "string",
    "confidence": number,
    "emotional_intensity": number,
    "emotional_stability": number,
    "secondary_emotions_present": [ "string", ... ]
  },
  "contextual_understanding": {
    "conversation_flow_assessment": "string",
    "language_style_changes_from_baseline": "string",
    "cultural_personal_communication_patterns": "string",
    "informal_language_slang_colloquialisms_detected": "string or array",
    "sarcasm_or_implied_emotions": "string",
    "subtext_and_hidden_meanings": "string"
  },
  "pattern_recognition": {
    "emotional_progression_from_previous_messages": "string",
    "response_pattern_changes": "string",
    "potential_triggers_identified": "string",
    "behavioral_shifts": "string"
  },
  "risk_assessment": {
    "mental_health_risk_level": "low|moderate|high|critical",
    "crisis_indicators": "string",
    "support_urgency": "low|moderate|high|critical"
  },
  "linguistic_analysis": {
    "sentence_structure_changes": "string",
    "vocabulary_shifts": "string",
    "punctuation_patterns": "string",
    "capitalization_usage": "string",
    "emoji_emoticon_usage": "string"
  }
}
Do not include any explanation or text outside the JSON.`;

    const requestBody = {
      model: 'qwen/qwen-2.5-72b-instruct',
      messages: [
        { role: 'system', content: 'You are an advanced emotional intelligence AI specializing in psychological assessment.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 600,
      top_p: 0.9
    };
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mindspace-app.com',
        'X-Title': 'MindSpace AI Emotion Analysis'
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';
    // Robust JSON extraction
    try {
      return JSON.parse(raw);
    } catch {
      // Try to extract JSON substring
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {}
      }
      return { error: 'Could not parse analysis', raw };
    }
  }

  /**
   * Send a chat message to the AI conversation for the current user and store it in Supabase.
   */
  async sendAIChatMessage({ userId, content, role }: { userId: string; content: string; role: 'user' | 'assistant' }) {
    const supabase = (await import('../lib/supabase')).supabase;
    // Helper to get or create the AI conversation
    async function getOrCreateAIConversationId(userId: string): Promise<string> {
      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .contains('participant_ids', [userId])
        .eq('type', 'ai')
        .order('started_at', { ascending: true })
        .limit(1);
      if (fetchError) throw fetchError;
      if (existing && existing.length > 0 && existing[0].id) return existing[0].id;
      // Only create if none exist
      try {
        const { data: created, error: createError } = await supabase
          .from('conversations')
          .insert({ participant_ids: [userId], type: 'ai' })
          .select('id')
          .single();
        if (createError || !created?.id) throw createError || new Error('Failed to create conversation');
        return created.id;
      } catch (e: any) {
        if (e.code === '23505' || (e.message && e.message.includes('duplicate key value'))) {
          const { data: retry, error: retryError } = await supabase
            .from('conversations')
            .select('id')
            .contains('participant_ids', [userId])
            .eq('type', 'ai')
            .order('started_at', { ascending: true })
            .limit(1);
          if (retryError || !retry || retry.length === 0) throw retryError || new Error('Failed to fetch existing conversation after unique violation');
          return retry[0].id;
        }
        throw e;
      }
    }
    const aiConversationId = await getOrCreateAIConversationId(userId);
    // Store sender_role in the message for correct UI placement
    await supabase.from('messages').insert({
      conversation_id: aiConversationId,
      sender_id: userId,
      content,
      message_type: 'text',
      sender_role: role,
      emotion_analysis: null,
    });
  }

  /**
   * Fetch all messages for a user's AI conversation, ordered by timestamp ascending.
   */
  async fetchAIChatMessages(userId: string) {
    const supabase = (await import('../lib/supabase')).supabase;
    // Get or create conversation
    async function getOrCreateAIConversationId(userId: string): Promise<string> {
      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .contains('participant_ids', [userId])
        .eq('type', 'ai')
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (existing && existing.id) return existing.id;
      const { data: created, error: createError } = await supabase
        .from('conversations')
        .insert({ participant_ids: [userId], type: 'ai' })
        .select('id')
        .single();
      if (createError || !created?.id) throw createError || new Error('Failed to create conversation');
      return created.id;
    }
    const aiConversationId = await getOrCreateAIConversationId(userId);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', aiConversationId)
      .order('timestamp', { ascending: true });
    if (error) throw error;
    return data;
  }
}

export const aiService = new AIService();
export type { ChatMessage };