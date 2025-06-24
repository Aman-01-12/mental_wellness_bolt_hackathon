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

  const { ticket_id, requester_display_name, requester_need_tags } = await req.json();

  if (!ticket_id || !requester_display_name) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
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

  // Prevent user from requesting their own ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("user_id")
    .eq("id", ticket_id)
    .single();

  if (ticketError || !ticket) {
    return new Response(JSON.stringify({ error: "Ticket not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (ticket.user_id === user.id) {
    return new Response(JSON.stringify({ error: "Cannot request your own ticket" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Insert match request
  const { data: matchRequest, error } = await supabase
    .from("match_requests")
    .insert([{
      ticket_id,
      requester_id: user.id,
      requester_display_name,
      requester_need_tags,
      status: "pending"
    }])
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ match_request: matchRequest }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
});