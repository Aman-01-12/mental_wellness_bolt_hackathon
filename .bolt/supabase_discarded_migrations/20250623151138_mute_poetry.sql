/*
  # Create chat_feedback table

  1. New Tables
    - `chat_feedback`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations.id)
      - `from_user_id` (uuid, references users.id)
      - `to_user_id` (uuid, references users.id)
      - `feedback_tags` (text array, not null)
      - `rating` (integer, not null)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `chat_feedback` table
    - Add policy for users to read feedback about themselves
    - Add policy for users to create feedback
    - Add policy for users to read feedback they gave
*/

CREATE TABLE IF NOT EXISTS public.chat_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    from_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    feedback_tags text[] NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view feedback about themselves"
    ON public.chat_feedback
    FOR SELECT
    TO authenticated
    USING (auth.uid() = to_user_id);

CREATE POLICY "Users can view feedback they gave"
    ON public.chat_feedback
    FOR SELECT
    TO authenticated
    USING (auth.uid() = from_user_id);

CREATE POLICY "Users can create feedback"
    ON public.chat_feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = from_user_id
        AND EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = chat_feedback.conversation_id
            AND auth.uid() = ANY(conversations.participant_ids)
        )
    );