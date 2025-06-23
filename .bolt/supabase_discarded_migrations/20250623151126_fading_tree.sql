/*
  # Create messages table

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations.id)
      - `sender_id` (uuid, references users.id)
      - `content` (text, not null)
      - `timestamp` (timestamptz, default now())
      - `message_type` (text, default 'text')
      - `emotion_analysis` (jsonb, nullable)

  2. Security
    - Enable RLS on `messages` table
    - Add policy for conversation participants to read messages
    - Add policy for authenticated users to create messages
    - Add policy for message senders to update their messages
*/

CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    timestamp timestamptz DEFAULT now() NOT NULL,
    message_type text DEFAULT 'text',
    emotion_analysis jsonb
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id
            AND auth.uid() = ANY(conversations.participant_ids)
        )
    );

CREATE POLICY "Users can create messages in their conversations"
    ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id
            AND auth.uid() = ANY(conversations.participant_ids)
        )
    );

CREATE POLICY "Users can update their own messages"
    ON public.messages
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = sender_id);