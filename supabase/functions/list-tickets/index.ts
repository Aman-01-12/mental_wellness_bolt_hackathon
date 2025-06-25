import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
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
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ No authorization header provided");
      return new Response(JSON.stringify({ 
        success: false,
        error: "No authorization token provided" 
      }), {
        status: 401,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    console.log("🔐 Auth header received:", authHeader.substring(0, 20) + "...");

    // Create Supabase client with service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create client with user token for auth verification
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { 
        global: { 
          headers: { 
            Authorization: authHeader 
          } 
        } 
      }
    );

    // Verify user authentication
    console.log("🔍 Verifying user authentication...");
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError) {
      console.error("❌ Authentication error:", userError);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Authentication failed: " + userError.message 
      }), {
        status: 401,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    if (!user) {
      console.error("❌ No user found in token");
      return new Response(JSON.stringify({ 
        success: false,
        error: "Invalid or expired authentication token" 
      }), {
        status: 401,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    console.log("✅ User authenticated:", user.id);

    // Parse query params for filtering (optional)
    const url = new URL(req.url);
    const emotional_state = url.searchParams.get("emotional_state");
    const need_tag = url.searchParams.get("need_tag");
    const age_range = url.searchParams.get("age_range");

    console.log("🔍 Query filters:", { emotional_state, need_tag, age_range });

    // Build query using admin client for reliable database access
    let query = supabaseAdmin
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

    console.log("📊 Executing database query...");
    const { data: tickets, error } = await query;

    if (error) {
      console.error("❌ Database error:", error);
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

    console.log("📊 Raw tickets from database:", tickets?.length || 0);
    console.log("📊 Sample tickets:", tickets?.slice(0, 2));

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

    console.log("✅ Returning result with", result.tickets.length, "tickets");

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      },
    });

  } catch (error) {
    console.error("❌ Unexpected error:", error);
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