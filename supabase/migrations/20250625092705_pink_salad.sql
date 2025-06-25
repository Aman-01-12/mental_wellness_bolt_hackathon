/*
  # Add name reveals functionality

  1. New Tables
    - `name_reveals`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to conversations)
      - `user_id` (uuid, foreign key to users)
      - `revealed_name` (text, the name being revealed)
      - `revealed_at` (timestamp)

  2. Security
    - Enable RLS on `name_reveals` table
    - Add policy for users to read name reveals in their conversations
    - Add policy for users to create name reveals in their conversations
*/

CREATE TABLE IF NOT EXISTS name_reveals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revealed_name text NOT NULL,
  revealed_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE name_reveals ENABLE ROW LEVEL SECURITY;

-- Users can read name reveals in conversations they participate in
CREATE POLICY "Users can read name reveals in their conversations"
  ON name_reveals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = name_reveals.conversation_id
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

-- Users can create name reveals in conversations they participate in
CREATE POLICY "Users can create name reveals in their conversations"
  ON name_reveals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = name_reveals.conversation_id
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_name_reveals_conversation_id ON name_reveals(conversation_id);
CREATE INDEX IF NOT EXISTS idx_name_reveals_user_id ON name_reveals(user_id);