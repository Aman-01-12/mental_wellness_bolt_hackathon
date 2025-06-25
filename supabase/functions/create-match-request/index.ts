import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateMatchRequestPayload {
  ticket_id: string;
  requester_display_name?: string;
  requester_need_tags?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const body: CreateMatchRequestPayload = await req.json();
    const { ticket_id, requester_display_name, requester_need_tags } = body;

    if (!ticket_id) {
      return new Response(
        JSON.stringify({ error: 'ticket_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the ticket exists and is not the user's own ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, user_id, status')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (ticket.user_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot request to connect to your own ticket' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (ticket.status !== 'open') {
      return new Response(
        JSON.stringify({ error: 'Ticket is no longer available' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user already has a pending request for this ticket
    const { data: existingRequest } = await supabase
      .from('match_requests')
      .select('id')
      .eq('ticket_id', ticket_id)
      .eq('requester_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return new Response(
        JSON.stringify({ error: 'You already have a pending request for this ticket' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create the match request
    const { data: matchRequest, error: createError } = await supabase
      .from('match_requests')
      .insert({
        ticket_id,
        requester_id: user.id,
        requester_display_name: requester_display_name || 'Anonymous',
        requester_need_tags: requester_need_tags || [],
        status: 'pending'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating match request:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create match request' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        match_request: matchRequest 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in create-match-request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});