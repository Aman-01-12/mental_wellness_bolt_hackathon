import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function analyzeEmotionWithQwen(text: string): Promise<EmotionAnalysis> {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  
  if (!openRouterApiKey) {
    throw new Error('OpenRouter API key not found');
  }
  
  console.log('🧠 Analyzing emotion with Qwen for text:', text.substring(0, 50) + '...');
  
  const prompt = `You are an advanced emotional intelligence AI specializing in comprehensive emotion analysis. Analyze the following text for emotional content:

TEXT TO ANALYZE: "${text}"

Provide a detailed emotional analysis in JSON format with the following structure:

{
  "primary_emotion": "string (the dominant emotion detected)",
  "confidence": number (0-1, confidence in the primary emotion detection),
  "all_emotions": [
    {
      "label": "string (emotion name)",
      "score": number (0-1, intensity/presence of this emotion)
    }
  ],
  "mental_health_indicators": {
    "anxiety_level": number (0-1, level of anxiety detected),
    "depression_level": number (0-1, level of depression/sadness detected),
    "stress_level": number (0-1, level of stress detected),
    "positive_sentiment": number (0-1, level of positive emotions)
  },
  "context_analysis": {
    "tone": "string (overall emotional tone)",
    "intensity": number (0-1, emotional intensity),
    "emotional_complexity": number (1-3, complexity of emotional state),
    "underlying_themes": ["array of strings (deeper emotional themes)"]
  }
}

ANALYSIS REQUIREMENTS:
1. Detect nuanced emotions beyond basic categories (happy, sad, angry, anxious, confused, excited, overwhelmed, hopeful, frustrated, grateful, etc.)
2. Consider context, subtext, and implied emotions
3. Recognize sarcasm, irony, and hidden feelings
4. Analyze linguistic patterns, word choice, and structure
5. Assess mental health indicators based on emotional content
6. Identify underlying psychological themes
7. Consider cultural and personal expression styles
8. Detect crisis language or concerning patterns
9. Look for emotional intensity markers (punctuation, capitalization, repetition)
10. Analyze emotional progression if multiple sentences

Be thorough and accurate. Focus on the emotional essence rather than just keywords. Consider the full context and meaning of the text. Respond ONLY with valid JSON - no additional text or explanations.`;

  console.log('🤖 Calling Qwen API via OpenRouter for emotion analysis...');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mindspace-app.com',
        'X-Title': 'MindSpace Emotion Analysis'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-72b-instruct',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 1500,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Qwen API error:', response.status, errorText);
      throw new Error(`Qwen API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    console.log('📊 Qwen raw response:', analysisText);

    // Parse JSON response
    try {
      const parsedAnalysis = JSON.parse(analysisText);
      console.log('✅ Qwen emotion analysis parsed successfully:', parsedAnalysis);
      
      // Validate the structure
      if (!parsedAnalysis.primary_emotion || !parsedAnalysis.mental_health_indicators) {
        throw new Error('Invalid analysis structure');
      }
      
      return parsedAnalysis;
    } catch (parseError) {
      console.error('❌ Failed to parse Qwen response as JSON:', parseError);
      console.error('Raw response:', analysisText);
      
      // Fallback analysis if JSON parsing fails
      return createFallbackAnalysis(text);
    }

  } catch (error) {
    console.error('Error in Qwen emotion analysis:', error);
    throw error;
  }
}

function createFallbackAnalysis(text: string): EmotionAnalysis {
  console.log('🔄 Creating fallback analysis for:', text.substring(0, 50) + '...');
  
  const lowerText = text.toLowerCase();
  
  // Simple emotion detection
  let primaryEmotion = 'neutral';
  let confidence = 0.5;
  
  if (lowerText.includes('sad') || lowerText.includes('cry') || lowerText.includes('depressed')) {
    primaryEmotion = 'sad';
    confidence = 0.7;
  } else if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('nervous')) {
    primaryEmotion = 'anxious';
    confidence = 0.7;
  } else if (lowerText.includes('angry') || lowerText.includes('mad') || lowerText.includes('frustrated')) {
    primaryEmotion = 'angry';
    confidence = 0.7;
  } else if (lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('excited')) {
    primaryEmotion = 'happy';
    confidence = 0.7;
  }
  
  return {
    primary_emotion: primaryEmotion,
    confidence: confidence,
    all_emotions: [
      { label: primaryEmotion, score: confidence },
      { label: 'neutral', score: 1 - confidence }
    ],
    mental_health_indicators: {
      anxiety_level: primaryEmotion === 'anxious' ? 0.6 : 0.3,
      depression_level: primaryEmotion === 'sad' ? 0.6 : 0.3,
      stress_level: ['anxious', 'angry', 'frustrated'].includes(primaryEmotion) ? 0.6 : 0.3,
      positive_sentiment: primaryEmotion === 'happy' ? 0.7 : 0.4
    },
    context_analysis: {
      tone: primaryEmotion,
      intensity: confidence,
      emotional_complexity: 1,
      underlying_themes: [primaryEmotion]
    }
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Parse request body
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required and must be a string' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Validate text length (prevent abuse)
    if (text.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Text too long. Maximum 5000 characters allowed.' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Perform emotion analysis with Qwen
    const emotionAnalysis = await analyzeEmotionWithQwen(text);

    return new Response(
      JSON.stringify({
        success: true,
        data: emotionAnalysis
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});