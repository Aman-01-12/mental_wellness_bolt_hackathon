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

    const { ticket_id } = await req.json();

    if (!ticket_id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "ticket_id is required" 
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

    // Verify ticket ownership and update status
    const { data: ticket, error: updateError } = await supabase
      .from("tickets")
      .update({ status: "closed" })
      .eq("id", ticket_id)
      .eq("user_id", user.id)
      .select()
      .single();

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

    if (!ticket) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Ticket not found or you don't have permission to withdraw it" 
      }), {
        status: 404,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Ticket withdrawn successfully" 
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