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

async function analyzeEmotionWithClaude(text: string): Promise<EmotionAnalysis> {
  const anthropicApiKey = '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';
  
  console.log('🧠 Analyzing emotion with Claude for text:', text.substring(0, 50) + '...');
  
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
1. Detect nuanced emotions beyond basic categories
2. Consider context, subtext, and implied emotions
3. Recognize sarcasm, irony, and hidden feelings
4. Analyze linguistic patterns, word choice, and structure
5. Assess mental health indicators based on emotional content
6. Identify underlying psychological themes
7. Consider cultural and personal expression styles
8. Detect crisis language or concerning patterns

Be thorough and accurate. Focus on the emotional essence rather than just keywords. Consider the full context and meaning of the text.`;

  console.log('🤖 Calling Claude API for emotion analysis...');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const analysisText = data.content[0].text;
    
    console.log('📊 Claude raw response:', analysisText);

    // Parse JSON response
    try {
      const parsedAnalysis = JSON.parse(analysisText);
      console.log('✅ Claude emotion analysis parsed successfully:', parsedAnalysis);
      return parsedAnalysis;
    } catch (parseError) {
      console.error('❌ Failed to parse Claude response as JSON:', parseError);
      console.error('Raw response:', analysisText);
      throw new Error(`Failed to parse Claude response: ${parseError.message}`);
    }

  } catch (error) {
    console.error('Error in Claude emotion analysis:', error);
    throw error;
  }
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

    // Perform emotion analysis with Claude
    const emotionAnalysis = await analyzeEmotionWithClaude(text);

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