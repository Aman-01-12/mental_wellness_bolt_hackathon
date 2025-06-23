/*
  # Create conversations table

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `participant_ids` (uuid array, not null)
      - `type` (text, not null)
      - `started_at` (timestamptz, default now())
      - `ended_at` (timestamptz, nullable)
      - `status` (text, default 'active')

  2. Security
    - Enable RLS on `conversations` table
    - Add policy for participants to read their conversations
    - Add policy for authenticated users to create conversations
    - Add policy for participants to update their conversations
*/

CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_ids uuid[] NOT NULL,
    type text NOT NULL,
    started_at timestamptz DEFAULT now() NOT NULL,
    ended_at timestamptz,
    status text DEFAULT 'active'
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations they participate in"
    ON public.conversations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Authenticated users can create conversations"
    ON public.conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY "Participants can update their conversations"
    ON public.conversations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = ANY(participant_ids));