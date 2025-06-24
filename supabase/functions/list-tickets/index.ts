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

    // Parse query params for filtering
    const url = new URL(req.url);
    const emotional_state = url.searchParams.get("emotional_state");
    const need_tag = url.searchParams.get("need_tag");

    console.log("Fetching tickets with filters:", { emotional_state, need_tag });

    let query = supabase
      .from("tickets")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (emotional_state) {
      query = query.eq("emotional_state", emotional_state);
    }
    if (need_tag) {
      query = query.contains("need_tags", [need_tag]);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
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

    console.log("Fetched tickets:", data?.length || 0, "tickets found");

    return new Response(JSON.stringify({ 
      success: true,
      tickets: data || [] 
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      },
    });

  } catch (error) {
    console.error("Unexpected error in list-tickets function:", error);
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