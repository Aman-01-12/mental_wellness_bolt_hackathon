import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ 
      success: false,
      error: "Method not allowed" 
    }), {
      status: 405,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Invalid JSON in request body" 
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    const { display_name, age_range, emotional_state, need_tags, details } = requestData;

    // Validate required fields
    if (!display_name || !emotional_state) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Missing required fields: display_name and emotional_state are required" 
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    // Validate need_tags is an array
    if (need_tags && !Array.isArray(need_tags)) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "need_tags must be an array" 
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    // Get user ID from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Authentication error:", userError);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Unauthorized - please sign in again" 
      }), {
        status: 401,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    console.log("Creating ticket for user:", user.id, "with data:", {
      display_name,
      age_range,
      emotional_state,
      need_tags,
      details
    });

    // Insert ticket
    const { data, error } = await supabase
      .from("tickets")
      .insert([{
        user_id: user.id,
        display_name: display_name.trim(),
        age_range: age_range || null,
        emotional_state: emotional_state.trim(),
        need_tags: need_tags || [],
        details: details || null,
        status: "open"
      }])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Failed to create ticket: ${error.message}`,
        details: error.details || null
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    console.log("Ticket created successfully:", data);

    return new Response(JSON.stringify({ 
      success: true,
      ticket: data 
    }), {
      status: 201,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      },
    });

  } catch (error) {
    console.error("Unexpected error in create-ticket function:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: "Internal server error",
      message: error.message || "Unknown error occurred"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      },
    });
  }
});