import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface EmotionResult {
  label: string;
  score: number;
}

interface HuggingFaceResponse {
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
  context_analysis: {
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

// Enhanced emotion mapping with context awareness
const emotionMapping: Record<string, string> = {
  'admiration': 'positive',
  'amusement': 'happy',
  'anger': 'angry',
  'annoyance': 'frustrated',
  'approval': 'positive',
  'caring': 'loving',
  'confusion': 'confused',
  'curiosity': 'curious',
  'desire': 'hopeful',
  'disappointment': 'sad',
  'disapproval': 'negative',
  'disgust': 'disgusted',
  'embarrassment': 'embarrassed',
  'excitement': 'excited',
  'fear': 'anxious',
  'gratitude': 'grateful',
  'grief': 'sad',
  'joy': 'happy',
  'love': 'loving',
  'nervousness': 'anxious',
  'optimism': 'hopeful',
  'pride': 'proud',
  'realization': 'thoughtful',
  'relief': 'relieved',
  'remorse': 'regretful',
  'sadness': 'sad',
  'surprise': 'surprised',
  'neutral': 'neutral'
};

// Context patterns for deeper understanding
const contextPatterns = {
  overwhelmed: [
    /can't handle/i, /too much/i, /overwhelming/i, /drowning/i, /suffocating/i,
    /breaking point/i, /can't cope/i, /falling apart/i, /losing control/i
  ],
  hopeless: [
    /no point/i, /give up/i, /hopeless/i, /nothing matters/i, /what's the use/i,
    /no way out/i, /trapped/i, /stuck/i, /never get better/i
  ],
  anxious: [
    /worried about/i, /scared that/i, /what if/i, /can't stop thinking/i,
    /racing thoughts/i, /panic/i, /nervous/i, /on edge/i, /restless/i
  ],
  depressed: [
    /feel empty/i, /numb/i, /don't care/i, /no energy/i, /exhausted/i,
    /worthless/i, /burden/i, /alone/i, /isolated/i, /dark place/i
  ],
  angry: [
    /so angry/i, /furious/i, /rage/i, /hate/i, /can't stand/i,
    /fed up/i, /sick of/i, /frustrated/i, /annoyed/i
  ],
  grateful: [
    /thankful/i, /grateful/i, /blessed/i, /appreciate/i, /lucky/i,
    /fortunate/i, /glad/i, /relieved/i
  ],
  excited: [
    /can't wait/i, /so excited/i, /thrilled/i, /amazing/i, /incredible/i,
    /fantastic/i, /wonderful/i, /awesome/i
  ],
  confused: [
    /don't understand/i, /confused/i, /lost/i, /unclear/i, /mixed up/i,
    /not sure/i, /uncertain/i, /puzzled/i
  ]
};

// Intensity modifiers
const intensityModifiers = {
  high: ['extremely', 'incredibly', 'absolutely', 'completely', 'totally', 'really', 'very', 'so', 'super'],
  medium: ['quite', 'pretty', 'fairly', 'somewhat', 'rather', 'kind of', 'sort of'],
  low: ['a bit', 'slightly', 'a little', 'maybe', 'perhaps', 'might be']
};

// Negation patterns
const negationPatterns = [
  /not\s+\w+/i, /don't\s+\w+/i, /can't\s+\w+/i, /won't\s+\w+/i,
  /never\s+\w+/i, /no\s+\w+/i, /nothing\s+\w+/i, /nobody\s+\w+/i
];

function analyzeContext(text: string): {
  tone: string;
  intensity: number;
  emotional_complexity: number;
  underlying_themes: string[];
} {
  const lowerText = text.toLowerCase();
  const themes: string[] = [];
  let intensity = 0.5; // Default medium intensity
  let tone = 'neutral';
  let emotionalComplexity = 1;

  // Analyze intensity modifiers
  for (const [level, modifiers] of Object.entries(intensityModifiers)) {
    for (const modifier of modifiers) {
      if (lowerText.includes(modifier)) {
        switch (level) {
          case 'high': intensity = Math.min(intensity + 0.3, 1); break;
          case 'medium': intensity = Math.min(intensity + 0.1, 1); break;
          case 'low': intensity = Math.max(intensity - 0.2, 0); break;
        }
      }
    }
  }

  // Check for negation (affects emotional interpretation)
  const hasNegation = negationPatterns.some(pattern => pattern.test(text));
  if (hasNegation) {
    intensity *= 0.8; // Reduce intensity for negated statements
    themes.push('negation');
  }

  // Analyze context patterns
  let maxPatternScore = 0;
  let dominantEmotion = 'neutral';

  for (const [emotion, patterns] of Object.entries(contextPatterns)) {
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        score += 1;
      }
    }
    
    if (score > 0) {
      themes.push(emotion);
      if (score > maxPatternScore) {
        maxPatternScore = score;
        dominantEmotion = emotion;
        tone = emotion;
      }
    }
  }

  // Calculate emotional complexity (multiple themes = higher complexity)
  emotionalComplexity = Math.min(themes.length * 0.5 + 1, 3);

  // Analyze sentence structure for additional context
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
  
  // Very short sentences might indicate urgency or distress
  if (avgSentenceLength < 20 && sentences.length > 1) {
    intensity = Math.min(intensity + 0.2, 1);
    themes.push('urgency');
  }

  // Long, complex sentences might indicate overthinking or anxiety
  if (avgSentenceLength > 100) {
    themes.push('overthinking');
    if (dominantEmotion === 'anxious' || dominantEmotion === 'confused') {
      intensity = Math.min(intensity + 0.1, 1);
    }
  }

  return {
    tone,
    intensity,
    emotional_complexity: emotionalComplexity,
    underlying_themes: themes
  };
}

function calculateAdvancedMentalHealthIndicators(
  text: string, 
  emotions: EmotionResult[], 
  context: any
): {
  anxiety_level: number;
  depression_level: number;
  stress_level: number;
  positive_sentiment: number;
} {
  const lowerText = text.toLowerCase();
  
  // Base scores from emotion analysis
  const anxiousEmotions = emotions.filter(e => 
    ['anxious', 'fear', 'nervousness', 'worried'].includes(e.label)
  ).reduce((sum, e) => sum + e.score, 0);

  const sadEmotions = emotions.filter(e => 
    ['sad', 'grief', 'disappointment', 'hopeless', 'empty'].includes(e.label)
  ).reduce((sum, e) => sum + e.score, 0);

  const positiveEmotions = emotions.filter(e => 
    ['happy', 'joy', 'excitement', 'gratitude', 'love', 'positive', 'proud'].includes(e.label)
  ).reduce((sum, e) => sum + e.score, 0);

  const stressEmotions = emotions.filter(e => 
    ['frustrated', 'overwhelmed', 'angry', 'annoyed'].includes(e.label)
  ).reduce((sum, e) => sum + e.score, 0);

  // Context-based adjustments
  let anxietyBoost = 0;
  let depressionBoost = 0;
  let stressBoost = 0;
  let positiveBoost = 0;

  // Analyze underlying themes
  if (context.underlying_themes.includes('overwhelmed')) {
    anxietyBoost += 0.3;
    stressBoost += 0.4;
  }
  
  if (context.underlying_themes.includes('hopeless')) {
    depressionBoost += 0.5;
    anxietyBoost += 0.2;
  }
  
  if (context.underlying_themes.includes('anxious')) {
    anxietyBoost += 0.3;
  }
  
  if (context.underlying_themes.includes('depressed')) {
    depressionBoost += 0.4;
  }

  if (context.underlying_themes.includes('grateful') || context.underlying_themes.includes('excited')) {
    positiveBoost += 0.3;
  }

  // Intensity affects all scores
  const intensityMultiplier = context.intensity;

  // Crisis detection patterns
  const crisisPatterns = [
    /kill myself/i, /suicide/i, /suicidal/i, /end it all/i, /want to die/i,
    /better off dead/i, /can't go on/i, /no way out/i, /end my life/i,
    /self harm/i, /hurt myself/i, /cut myself/i
  ];
  
  const hasCrisis = crisisPatterns.some(pattern => pattern.test(text));
  const crisisBoost = hasCrisis ? 0.6 : 0;

  return {
    anxiety_level: Math.min((anxiousEmotions + anxietyBoost + crisisBoost) * intensityMultiplier, 1),
    depression_level: Math.min((sadEmotions + depressionBoost + crisisBoost) * intensityMultiplier, 1),
    stress_level: Math.min((stressEmotions + stressBoost + (crisisBoost * 0.5)) * intensityMultiplier, 1),
    positive_sentiment: Math.max(Math.min((positiveEmotions + positiveBoost) * intensityMultiplier, 1) - crisisBoost, 0)
  };
}

async function analyzeEmotionWithHuggingFace(text: string): Promise<EmotionAnalysis> {
  const huggingFaceApiKey = Deno.env.get('HUGGINGFACE_API_KEY');
  
  if (!huggingFaceApiKey) {
    console.error('❌ HuggingFace API key not found - NO FALLBACK AVAILABLE');
    throw new Error('HuggingFace API key not configured');
  }

  console.log('🤖 Calling HuggingFace API for emotion analysis');
  
  const response = await fetch(
    'https://api-inference.huggingface.co/models/SamLowe/roberta-base-go_emotions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${huggingFaceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        options: {
          wait_for_model: true
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ HuggingFace API error: ${response.status} - ${errorText}`);
    throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
  }

  const results: HuggingFaceResponse[] = await response.json();
  console.log('📊 HuggingFace raw results:', results);
  
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error('Invalid response from HuggingFace API');
  }

  // Sort by confidence score
  const sortedEmotions = results.sort((a, b) => b.score - a.score);
  
  // Map to our emotion categories and enhance with context
  const mappedEmotions: EmotionResult[] = sortedEmotions.map(emotion => ({
    label: emotionMapping[emotion.label] || emotion.label,
    score: emotion.score
  }));

  // Analyze context for additional insights
  const context = analyzeContext(text);
  console.log('🎯 Context analysis:', context);
  
  // Enhance emotion scores based on context
  const enhancedEmotions = mappedEmotions.map(emotion => {
    let enhancedScore = emotion.score;
    
    // Boost scores if context themes align with detected emotions
    if (context.underlying_themes.includes(emotion.label)) {
      enhancedScore = Math.min(enhancedScore + (context.intensity * 0.2), 1);
    }
    
    return {
      ...emotion,
      score: enhancedScore
    };
  });

  // Re-sort after enhancement
  enhancedEmotions.sort((a, b) => b.score - a.score);

  // Calculate mental health indicators with context awareness
  const mentalHealthIndicators = calculateAdvancedMentalHealthIndicators(text, enhancedEmotions, context);

  const result = {
    primary_emotion: enhancedEmotions[0].label,
    confidence: enhancedEmotions[0].score,
    all_emotions: enhancedEmotions.slice(0, 5), // Top 5 emotions
    mental_health_indicators: mentalHealthIndicators,
    context_analysis: context
  };

  console.log('✅ Enhanced emotion analysis result:', result);
  return result;
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

    console.log(`🧠 Analyzing emotion for text: "${text.substring(0, 100)}..."`);

    // Perform advanced emotion analysis - NO FALLBACK
    const emotionAnalysis = await analyzeEmotionWithHuggingFace(text);

    console.log('✅ Final emotion analysis result:', emotionAnalysis);

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
    console.error('❌ Edge function error:', error);
    
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