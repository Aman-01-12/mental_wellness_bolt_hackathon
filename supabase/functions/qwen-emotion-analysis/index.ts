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
  fuzzy_indicators?: {
    emotional_stability: number;
    communication_openness: number;
    support_seeking_behavior: number;
    coping_mechanisms: string[];
    relationship_to_emotions: string;
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
  
  console.log('🧠 Performing human-like fuzzy emotion analysis with Qwen...');
  
  // Enhanced prompt for human-like emotional understanding
  const prompt = `You are an advanced emotional intelligence AI that understands emotions like a seasoned human psychologist. Your analysis goes beyond keywords to understand the deeper emotional landscape, using fuzzy logic and human-like reasoning.

HUMAN-LIKE EMOTIONAL UNDERSTANDING PRINCIPLES:
- Emotions are complex, layered, and often contradictory
- Context and subtext matter more than specific words
- People express emotions differently based on personality, culture, and situation
- What's NOT said is often more important than what is said
- Emotional patterns emerge through communication style, not just content
- Defensive mechanisms and emotional walls are common
- Vulnerability indicators are subtle but important
- Coping strategies reveal emotional state

TEXT TO ANALYZE: "${text}"

ADVANCED ANALYSIS REQUIREMENTS:

1. **Multi-layered Emotional Detection**:
   - Primary emotion (most dominant feeling)
   - Secondary emotions (underlying/mixed feelings)
   - Hidden emotions (what might not be directly expressed)
   - Emotional conflicts (contradictory feelings)

2. **Fuzzy Logic Mental Health Assessment**:
   - Anxiety patterns: Look for overwhelm, uncertainty, future-focused worry, control issues
   - Depression indicators: Energy levels, hope/hopelessness, connection patterns, self-worth
   - Stress manifestations: Pressure, time concerns, overwhelm, responsibility burden
   - Positive sentiment: Hope, gratitude, connection, growth mindset, resilience

3. **Communication Style Analysis**:
   - Emotional openness level (willingness to be vulnerable)
   - Communication barriers or defensive walls
   - Support-seeking vs. self-reliance patterns
   - Emotional regulation attempts

4. **Contextual Reasoning**:
   - What life situation might this reflect?
   - What emotional needs are being expressed?
   - What coping mechanisms are being used?
   - What support might they be seeking?

5. **Human Interpretation Patterns**:
   - What would a caring friend notice?
   - What would an experienced therapist pick up on?
   - What emotional themes are emerging?
   - What strengths and resources are present?

EXAMPLES OF HUMAN-LIKE REASONING:

Text: "I'm fine, just tired"
Human Analysis: Likely minimizing emotional distress; "tired" might indicate emotional exhaustion rather than physical fatigue; "fine" often masks deeper struggles

Text: "Everything's going great! Super busy with work and stuff"
Human Analysis: Forced positivity possible; using busyness as emotional avoidance; exclamation points might indicate trying to convince self/others

Text: "idk... just one of those days i guess"
Human Analysis: Emotional withdrawal indicated by lowercase, ellipsis shows hesitation/sadness; minimizing with "i guess" suggests difficulty acknowledging feelings

Text: "Why does everything have to be so complicated?"
Human Analysis: Overwhelm and frustration; questioning suggests seeking understanding; "everything" indicates global thinking pattern common in stress/depression

RESPONSE FORMAT (JSON only, no additional text):
{
  "primary_emotion": "string (nuanced emotion, not just basic categories)",
  "confidence": number (0-1, based on clarity of emotional expression),
  "all_emotions": [
    {
      "label": "string (include subtle, complex emotions)",
      "score": number (0-1, fuzzy membership score)
    }
  ],
  "mental_health_indicators": {
    "anxiety_level": number (0-1, based on patterns not keywords),
    "depression_level": number (0-1, energy/hope/connection patterns),
    "stress_level": number (0-1, overwhelm/pressure indicators),
    "positive_sentiment": number (0-1, hope/growth/connection indicators)
  },
  "context_analysis": {
    "tone": "string (emotional atmosphere of the message)",
    "intensity": number (0-1, emotional charge/energy level),
    "emotional_complexity": number (1-3, how layered the emotions are),
    "underlying_themes": ["array of deeper emotional themes"]
  },
  "fuzzy_indicators": {
    "emotional_stability": number (0-1, emotional regulation ability),
    "communication_openness": number (0-1, willingness to share/be vulnerable),
    "support_seeking_behavior": number (0-1, reaching out vs. withdrawing),
    "coping_mechanisms": ["array of observed coping strategies"],
    "relationship_to_emotions": "string (how they relate to their feelings)"
  }
}

CRITICAL INSTRUCTIONS:
- Use fuzzy logic, not binary thinking
- Consider emotional subtext and implications
- Look for patterns in communication style
- Identify defensive or protective language
- Assess vulnerability and openness levels
- Recognize coping and regulation attempts
- Consider relational and social context
- Identify strength and resilience markers
- Think like a human with emotional intelligence
- Respond ONLY with valid JSON, no explanations`;

  console.log('🤖 Calling Qwen API via OpenRouter for human-like analysis...');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mindspace-app.com',
        'X-Title': 'MindSpace Human-like Emotion Analysis'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-72b-instruct',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.4, // Lower for more consistent analysis
        max_tokens: 2000,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Qwen API error:', response.status, errorText);
      throw new Error(`Qwen API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure from Qwen API');
    }
    
    let analysisText = data.choices[0].message.content;
    
    console.log('📊 Qwen human-like analysis response:', analysisText);

    // Clean up markdown code blocks if present
    if (analysisText.includes('```json')) {
      analysisText = analysisText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      console.log('🧹 Cleaned markdown formatting from response');
    } else if (analysisText.includes('```')) {
      analysisText = analysisText.replace(/```\s*/g, '').trim();
      console.log('🧹 Cleaned generic markdown formatting from response');
    }

    // Parse JSON response with enhanced error handling
    try {
      const parsedAnalysis = JSON.parse(analysisText);
      console.log('✅ Human-like emotion analysis parsed successfully:', parsedAnalysis);
      
      // Validate and enhance the structure
      if (!parsedAnalysis.primary_emotion || !parsedAnalysis.mental_health_indicators) {
        throw new Error('Invalid analysis structure - missing required fields');
      }
      
      // Ensure all required fields have valid values with fuzzy logic bounds
      const validatedAnalysis: EmotionAnalysis = {
        primary_emotion: parsedAnalysis.primary_emotion || 'neutral',
        confidence: Math.max(0, Math.min(1, parsedAnalysis.confidence || 0.5)),
        all_emotions: Array.isArray(parsedAnalysis.all_emotions) ? 
          parsedAnalysis.all_emotions.map((e: any) => ({
            label: e.label || 'neutral',
            score: Math.max(0, Math.min(1, e.score || 0))
          })) : [
            { label: parsedAnalysis.primary_emotion || 'neutral', score: parsedAnalysis.confidence || 0.5 }
          ],
        mental_health_indicators: {
          anxiety_level: Math.max(0, Math.min(1, parsedAnalysis.mental_health_indicators?.anxiety_level || 0.2)),
          depression_level: Math.max(0, Math.min(1, parsedAnalysis.mental_health_indicators?.depression_level || 0.2)),
          stress_level: Math.max(0, Math.min(1, parsedAnalysis.mental_health_indicators?.stress_level || 0.2)),
          positive_sentiment: Math.max(0, Math.min(1, parsedAnalysis.mental_health_indicators?.positive_sentiment || 0.5))
        },
        context_analysis: parsedAnalysis.context_analysis ? {
          tone: parsedAnalysis.context_analysis.tone || 'neutral',
          intensity: Math.max(0, Math.min(1, parsedAnalysis.context_analysis.intensity || 0.5)),
          emotional_complexity: Math.max(1, Math.min(3, parsedAnalysis.context_analysis.emotional_complexity || 1)),
          underlying_themes: Array.isArray(parsedAnalysis.context_analysis.underlying_themes) ? 
            parsedAnalysis.context_analysis.underlying_themes : []
        } : undefined,
        fuzzy_indicators: parsedAnalysis.fuzzy_indicators ? {
          emotional_stability: Math.max(0, Math.min(1, parsedAnalysis.fuzzy_indicators.emotional_stability || 0.5)),
          communication_openness: Math.max(0, Math.min(1, parsedAnalysis.fuzzy_indicators.communication_openness || 0.5)),
          support_seeking_behavior: Math.max(0, Math.min(1, parsedAnalysis.fuzzy_indicators.support_seeking_behavior || 0.3)),
          coping_mechanisms: Array.isArray(parsedAnalysis.fuzzy_indicators.coping_mechanisms) ? 
            parsedAnalysis.fuzzy_indicators.coping_mechanisms : [],
          relationship_to_emotions: parsedAnalysis.fuzzy_indicators.relationship_to_emotions || 'Neutral emotional relationship'
        } : undefined
      };
      
      return validatedAnalysis;
      
    } catch (parseError) {
      console.error('❌ Failed to parse Qwen response as JSON:', parseError);
      console.error('Raw response after cleanup:', analysisText);
      throw new Error(`Failed to parse Qwen response: ${parseError.message}`);
    }

  } catch (error) {
    console.error('❌ Error in Qwen human-like emotion analysis:', error);
    throw new Error(`Qwen analysis failed: ${error.message}`);
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
        JSON.stringify({ 
          success: false,
          error: 'Method not allowed' 
        }),
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
        JSON.stringify({ 
          success: false,
          error: 'Text is required and must be a string' 
        }),
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
    if (text.length > 10000) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Text too long. Maximum 10000 characters allowed.' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Perform human-like emotion analysis with Qwen
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