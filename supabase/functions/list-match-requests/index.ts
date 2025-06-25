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

    // Parse query params
    const url = new URL(req.url);
    const ticket_id = url.searchParams.get("ticket_id");

    if (!ticket_id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "ticket_id parameter is required" 
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    console.log("Fetching match requests for ticket:", ticket_id, "by user:", user.id);

    // Verify that the user owns the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("user_id")
      .eq("id", ticket_id)
      .single();

    if (ticketError || !ticket) {
      console.error("Ticket not found:", ticketError);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Ticket not found" 
      }), {
        status: 404,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    if (ticket.user_id !== user.id) {
      console.error("User does not own ticket:", user.id, "vs", ticket.user_id);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Forbidden - you can only view requests for your own tickets" 
      }), {
        status: 403,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    // Fetch pending match requests for this ticket
    const { data: requests, error } = await supabase
      .from("match_requests")
      .select(`
        id,
        requester_id,
        requester_display_name,
        requester_need_tags,
        status,
        created_at
      `)
      .eq("ticket_id", ticket_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({ 
        success: false,
        error: `Failed to fetch match requests: ${error.message}`,
        details: error.details || null
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    console.log("Fetched match requests:", requests?.length || 0, "requests found");

    return new Response(JSON.stringify({ 
      success: true,
      requests: requests || [] 
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      },
    });

  } catch (error) {
    console.error("Unexpected error in list-match-requests function:", error);
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