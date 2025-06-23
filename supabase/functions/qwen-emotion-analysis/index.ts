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
  
  // If no API key is available, use fallback analysis
  if (!openRouterApiKey) {
    console.log('⚠️ OpenRouter API key not found, using fallback analysis');
    return createFallbackAnalysis(text);
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
      console.log('🔄 Falling back to local analysis due to API error');
      return createFallbackAnalysis(text);
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
    console.log('🔄 Falling back to local analysis due to network error');
    return createFallbackAnalysis(text);
  }
}

function createFallbackAnalysis(text: string): EmotionAnalysis {
  console.log('🔄 Creating enhanced fallback analysis for:', text.substring(0, 50) + '...');
  
  const lowerText = text.toLowerCase();
  
  // Enhanced emotion detection with more keywords and patterns
  let primaryEmotion = 'neutral';
  let confidence = 0.6;
  let anxietyLevel = 0.2;
  let depressionLevel = 0.2;
  let stressLevel = 0.2;
  let positiveSentiment = 0.5;
  
  // Anxiety indicators
  const anxietyKeywords = ['anxious', 'worried', 'nervous', 'panic', 'fear', 'scared', 'overwhelmed', 'stress', 'tension'];
  const anxietyCount = anxietyKeywords.filter(word => lowerText.includes(word)).length;
  if (anxietyCount > 0) {
    primaryEmotion = 'anxious';
    confidence = Math.min(0.8, 0.5 + anxietyCount * 0.1);
    anxietyLevel = Math.min(0.9, 0.4 + anxietyCount * 0.15);
    stressLevel = Math.min(0.8, 0.3 + anxietyCount * 0.1);
  }
  
  // Depression indicators
  const depressionKeywords = ['sad', 'depressed', 'hopeless', 'empty', 'worthless', 'tired', 'exhausted', 'lonely', 'cry', 'crying'];
  const depressionCount = depressionKeywords.filter(word => lowerText.includes(word)).length;
  if (depressionCount > 0) {
    primaryEmotion = 'sad';
    confidence = Math.min(0.8, 0.5 + depressionCount * 0.1);
    depressionLevel = Math.min(0.9, 0.4 + depressionCount * 0.15);
    positiveSentiment = Math.max(0.1, 0.5 - depressionCount * 0.1);
  }
  
  // Anger indicators
  const angerKeywords = ['angry', 'mad', 'frustrated', 'furious', 'annoyed', 'irritated', 'rage', 'hate'];
  const angerCount = angerKeywords.filter(word => lowerText.includes(word)).length;
  if (angerCount > 0) {
    primaryEmotion = 'angry';
    confidence = Math.min(0.8, 0.5 + angerCount * 0.1);
    stressLevel = Math.min(0.8, 0.4 + angerCount * 0.1);
  }
  
  // Positive emotion indicators
  const positiveKeywords = ['happy', 'joy', 'excited', 'grateful', 'love', 'amazing', 'wonderful', 'great', 'good', 'better'];
  const positiveCount = positiveKeywords.filter(word => lowerText.includes(word)).length;
  if (positiveCount > 0) {
    primaryEmotion = 'happy';
    confidence = Math.min(0.8, 0.5 + positiveCount * 0.1);
    positiveSentiment = Math.min(0.9, 0.6 + positiveCount * 0.1);
    anxietyLevel = Math.max(0.1, anxietyLevel - positiveCount * 0.05);
    depressionLevel = Math.max(0.1, depressionLevel - positiveCount * 0.05);
  }
  
  // Check for intensity markers
  const hasExclamation = (text.match(/!/g) || []).length;
  const hasCapitalization = /[A-Z]{3,}/.test(text);
  const hasRepetition = /(.)\1{2,}/.test(text);
  
  let intensity = 0.5;
  if (hasExclamation > 0) intensity += 0.1;
  if (hasCapitalization) intensity += 0.15;
  if (hasRepetition) intensity += 0.1;
  intensity = Math.min(1.0, intensity);
  
  // Adjust levels based on intensity
  if (intensity > 0.7) {
    anxietyLevel = Math.min(0.9, anxietyLevel + 0.1);
    stressLevel = Math.min(0.9, stressLevel + 0.1);
  }
  
  // Create emotion array
  const allEmotions: EmotionResult[] = [
    { label: primaryEmotion, score: confidence }
  ];
  
  // Add secondary emotions
  if (primaryEmotion !== 'neutral') {
    allEmotions.push({ label: 'neutral', score: Math.max(0.1, 1 - confidence) });
  }
  
  if (anxietyLevel > 0.4 && primaryEmotion !== 'anxious') {
    allEmotions.push({ label: 'anxious', score: anxietyLevel });
  }
  
  if (depressionLevel > 0.4 && primaryEmotion !== 'sad') {
    allEmotions.push({ label: 'sad', score: depressionLevel });
  }
  
  // Determine underlying themes
  const themes: string[] = [];
  if (anxietyLevel > 0.5) themes.push('anxiety and worry');
  if (depressionLevel > 0.5) themes.push('sadness and low mood');
  if (stressLevel > 0.5) themes.push('stress and pressure');
  if (positiveSentiment > 0.6) themes.push('positive outlook');
  if (themes.length === 0) themes.push('emotional balance');
  
  return {
    primary_emotion: primaryEmotion,
    confidence: confidence,
    all_emotions: allEmotions,
    mental_health_indicators: {
      anxiety_level: anxietyLevel,
      depression_level: depressionLevel,
      stress_level: stressLevel,
      positive_sentiment: positiveSentiment
    },
    context_analysis: {
      tone: primaryEmotion,
      intensity: intensity,
      emotional_complexity: themes.length > 2 ? 3 : themes.length > 1 ? 2 : 1,
      underlying_themes: themes
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

    // Perform emotion analysis with Qwen (or fallback)
    const emotionAnalysis = await analyzeEmotionWithQwen(text);

    return new Response(
      JSON.stringify({
        success: true,
        data: emotionAnalysis,
        fallback_used: !Deno.env.get('OPENROUTER_API_KEY')
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