import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  const { match_request_id, status } = await req.json();

  if (!match_request_id || !["accepted", "declined"].includes(status)) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get user ID from JWT
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch the match request and ticket
  const { data: matchRequest, error: matchError } = await supabase
    .from("match_requests")
    .select("id, ticket_id, status")
    .eq("id", match_request_id)
    .single();

  if (matchError || !matchRequest) {
    return new Response(JSON.stringify({ error: "Match request not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("user_id")
    .eq("id", matchRequest.ticket_id)
    .single();

  if (ticketError || !ticket) {
    return new Response(JSON.stringify({ error: "Ticket not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only the ticket owner can accept/decline
  if (ticket.user_id !== user.id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Update the match request status
  const { data: updatedRequest, error: updateError } = await supabase
    .from("match_requests")
    .update({ status })
    .eq("id", match_request_id)
    .select()
    .single();

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // On acceptance, create a conversation and return its ID
  if (status === "accepted") {
    // Fetch requester_id from match_requests
    const { data: fullRequest, error: reqError } = await supabase
      .from("match_requests")
      .select("requester_id, ticket_id")
      .eq("id", match_request_id)
      .single();
    if (reqError || !fullRequest) {
      return new Response(JSON.stringify({ error: "Could not fetch requester info" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const requesterId = fullRequest.requester_id;
    const ticketOwnerId = ticket.user_id;
    // Check if a conversation already exists between these two users
    let conversationId = null;
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id, participant_ids")
      .contains("participant_ids", [requesterId, ticketOwnerId])
      .single();
    if (existingConv && existingConv.id) {
      conversationId = existingConv.id;
    } else {
      // Create a new conversation
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert([
          {
            participant_ids: [requesterId, ticketOwnerId],
            type: "peer",
            status: "active"
          }
        ])
        .select()
        .single();
      if (convError || !newConv) {
        return new Response(JSON.stringify({ error: convError?.message || "Failed to create conversation" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      conversationId = newConv.id;
    }
    return new Response(JSON.stringify({ match_request: updatedRequest, conversation_id: conversationId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // If declined, just return the match request as before
  return new Response(JSON.stringify({ match_request: updatedRequest }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});