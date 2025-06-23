/*
  # Create user_badges table

  1. New Tables
    - `user_badges`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `badge_type` (text, not null)
      - `count` (integer, default 1)
      - `earned_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `user_badges` table
    - Add policy for users to read their own badges
    - Add policy for system to create badges
    - Add policy for system to update badge counts
*/

CREATE TABLE IF NOT EXISTS public.user_badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_type text NOT NULL,
    count integer DEFAULT 1,
    earned_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
    ON public.user_badges
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "System can create badges"
    ON public.user_badges
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "System can update badge counts"
    ON public.user_badges
    FOR UPDATE
    TO authenticated
    USING (true);