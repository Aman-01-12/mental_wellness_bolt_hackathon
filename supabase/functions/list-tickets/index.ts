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

  if (req.method !== "GET") {
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

    // Get user ID from JWT for debugging
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

    console.log("🔍 Edge Function: Fetching tickets for user:", user.id);

    // Parse query params for filtering (optional)
    const url = new URL(req.url);
    const emotional_state = url.searchParams.get("emotional_state");
    const need_tag = url.searchParams.get("need_tag");
    const age_range = url.searchParams.get("age_range");

    console.log("🔍 Edge Function: Query filters:", { emotional_state, need_tag, age_range });

    // Build query - fetch ALL open tickets (don't filter by user here, let frontend handle it)
    let query = supabase
      .from("tickets")
      .select(`
        id,
        user_id,
        display_name,
        age_range,
        emotional_state,
        need_tags,
        details,
        status,
        created_at,
        updated_at
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    // Apply optional filters if provided
    if (emotional_state) {
      query = query.eq("emotional_state", emotional_state);
    }
    if (need_tag) {
      query = query.contains("need_tags", [need_tag]);
    }
    if (age_range) {
      query = query.eq("age_range", age_range);
    }

    const { data: tickets, error } = await query;

    if (error) {
      console.error("❌ Edge Function: Database error:", error);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Failed to fetch tickets: ${error.message}`,
        details: error.details || null
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    console.log("📊 Edge Function: Raw tickets from database:", tickets?.length || 0);
    console.log("📊 Edge Function: Sample tickets:", tickets?.slice(0, 2));
    console.log("📊 Edge Function: User IDs in tickets:", tickets?.map(t => t.user_id));
    console.log("📊 Edge Function: Current user ID:", user.id);

    // Return ALL tickets - let the frontend filter out user's own tickets
    const result = {
      success: true,
      tickets: tickets || [],
      debug: {
        total_tickets: tickets?.length || 0,
        current_user_id: user.id,
        filters_applied: { emotional_state, need_tag, age_range },
        sample_user_ids: tickets?.slice(0, 3).map(t => t.user_id) || []
      }
    };

    console.log("✅ Edge Function: Returning result:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      },
    });

  } catch (error) {
    console.error("❌ Edge Function: Unexpected error:", error);
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