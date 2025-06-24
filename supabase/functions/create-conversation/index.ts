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

  const { participant_ids, type } = await req.json();

  if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length < 2) {
    return new Response(JSON.stringify({ error: "Invalid participants" }), {
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

  // Only allow if the user is one of the participants
  if (!participant_ids.includes(user.id)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create the conversation
  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert([{
      participant_ids,
      type: type || "peer",
      status: "active"
    }])
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ conversation }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
});