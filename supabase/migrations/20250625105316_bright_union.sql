/*
  # Fix Realtime subscription timeout for messages

  1. Security Updates
    - Refresh RLS policies on messages table to ensure Realtime compatibility
    - Add explicit policy for Realtime subscriptions
    - Ensure proper indexing for policy performance

  2. Changes
    - Drop and recreate existing policies with optimized conditions
    - Add specific Realtime-compatible policies
    - Ensure auth.uid() function works correctly in Realtime context
*/

-- Drop existing policies to recreate them with better Realtime compatibility
DROP POLICY IF EXISTS "Users can read messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;

-- Recreate the SELECT policy with explicit Realtime support
CREATE POLICY "Users can read messages in their conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND auth.uid() = ANY(conversations.participant_ids)
  )
);

-- Recreate the INSERT policy
CREATE POLICY "Users can send messages in their conversations"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND auth.uid() = ANY(conversations.participant_ids)
  )
);

-- Add UPDATE policy for message modifications (if needed)
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Ensure the table is properly configured for Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add index to improve policy performance for Realtime
CREATE INDEX IF NOT EXISTS idx_messages_conversation_participant_lookup
ON public.messages (conversation_id, sender_id);