import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  if (req.method !== "GET") {
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

  // Parse query params for filtering
  const url = new URL(req.url);
  const emotional_state = url.searchParams.get("emotional_state");
  const need_tag = url.searchParams.get("need_tag");

  let query = supabase
    .from("tickets")
    .select("*")
    .eq("status", "open");

  if (emotional_state) {
    query = query.eq("emotional_state", emotional_state);
  }
  if (need_tag) {
    query = query.contains("need_tags", [need_tag]);
  }

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ tickets: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});