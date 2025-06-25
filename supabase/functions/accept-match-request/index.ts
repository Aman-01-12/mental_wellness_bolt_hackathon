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

    const { request_id } = await req.json();

    if (!request_id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "request_id is required" 
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
      return new Response(JSON.stringify({ 
        success: false,
        error: "Unauthorized" 
      }), {
        status: 401,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    // Get the match request and verify ownership
    const { data: matchRequest, error: matchError } = await supabase
      .from("match_requests")
      .select(`
        id,
        ticket_id,
        requester_id,
        status,
        tickets!inner(user_id)
      `)
      .eq("id", request_id)
      .single();

    if (matchError || !matchRequest) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Match request not found" 
      }), {
        status: 404,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    // Only ticket owner can accept requests
    if (matchRequest.tickets.user_id !== user.id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Forbidden" 
      }), {
        status: 403,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    // Update match request status to accepted
    const { error: updateError } = await supabase
      .from("match_requests")
      .update({ status: "accepted" })
      .eq("id", request_id);

    if (updateError) {
      return new Response(JSON.stringify({ 
        success: false,
        error: updateError.message 
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    // Create conversation between the two users
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert([{
        participant_ids: [user.id, matchRequest.requester_id],
        type: "peer",
        status: "active"
      }])
      .select()
      .single();

    if (convError) {
      return new Response(JSON.stringify({ 
        success: false,
        error: convError.message 
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      conversation_id: conversation.id 
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      },
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: "Internal server error" 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      },
    });
  }
});