/*
  # Create tickets table

  1. New Tables
    - `tickets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `display_name` (text, not null)
      - `age_range` (text, nullable)
      - `emotional_state` (text, not null)
      - `need_tags` (text array, not null)
      - `details` (jsonb, nullable)
      - `status` (text, default 'open')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `tickets` table
    - Add policy for users to read all tickets
    - Add policy for users to create their own tickets
    - Add policy for users to update their own tickets
*/

CREATE TABLE IF NOT EXISTS public.tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    display_name text NOT NULL,
    age_range text,
    emotional_state text NOT NULL,
    need_tags text[] NOT NULL,
    details jsonb,
    status text DEFAULT 'open',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all tickets"
    ON public.tickets
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create their own tickets"
    ON public.tickets
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
    ON public.tickets
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create trigger for tickets table
CREATE TRIGGER IF NOT EXISTS update_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();