/*
  # Create users table and related schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `display_name` (text)
      - `age_range` (text)
      - `gender` (text)
      - `personality_traits` (text array)
      - `work_status` (text)
      - `work_style` (text)
      - `food_habits` (text)
      - `sleep_duration` (integer)
      - `relationship_status` (text)
      - `communication_style` (text)
      - `support_type` (text)
      - `availability` (text)
      - `mental_health_background` (jsonb)
      - `privacy_settings` (jsonb)
      - `onboarding_completed` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `tickets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `display_name` (text)
      - `age_range` (text)
      - `emotional_state` (text)
      - `need_tags` (text array)
      - `details` (jsonb)
      - `status` (text, default 'open')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `conversations`
      - `id` (uuid, primary key)
      - `participant_ids` (uuid array)
      - `type` (text)
      - `started_at` (timestamptz, default now())
      - `ended_at` (timestamptz)
      - `status` (text, default 'active')

    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations.id)
      - `sender_id` (uuid, references users.id)
      - `content` (text)
      - `timestamp` (timestamptz, default now())
      - `message_type` (text, default 'text')
      - `emotion_analysis` (jsonb)

    - `user_badges`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `badge_type` (text)
      - `count` (integer, default 1)
      - `earned_at` (timestamptz, default now())

    - `chat_feedback`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations.id)
      - `from_user_id` (uuid, references users.id)
      - `to_user_id` (uuid, references users.id)
      - `feedback_tags` (text array)
      - `rating` (integer)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add trigger to automatically create user profile on auth signup

  3. Functions
    - Auto-update updated_at timestamps
    - Auto-create user profile on signup
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  age_range text,
  gender text,
  personality_traits text[] DEFAULT '{}',
  work_status text,
  work_style text,
  food_habits text,
  sleep_duration integer,
  relationship_status text,
  communication_style text,
  support_type text,
  availability text,
  mental_health_background jsonb,
  privacy_settings jsonb,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  display_name text NOT NULL,
  age_range text,
  emotional_state text NOT NULL,
  need_tags text[] DEFAULT '{}',
  details jsonb,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids uuid[] NOT NULL,
  type text NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  status text DEFAULT 'active'
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  message_type text DEFAULT 'text',
  emotion_analysis jsonb
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  badge_type text NOT NULL,
  count integer DEFAULT 1,
  earned_at timestamptz DEFAULT now()
);

-- Create chat_feedback table
CREATE TABLE IF NOT EXISTS chat_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  from_user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  feedback_tags text[] DEFAULT '{}',
  rating integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for tickets table
CREATE POLICY "Users can read own tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for conversations table
CREATE POLICY "Users can read conversations they participate in"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can update conversations they participate in"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = ANY(participant_ids));

-- Create policies for messages table
CREATE POLICY "Users can read messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

-- Create policies for user_badges table
CREATE POLICY "Users can read own badges"
  ON user_badges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read others' badges for public display"
  ON user_badges
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for chat_feedback table
CREATE POLICY "Users can read feedback they gave or received"
  ON chat_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create feedback"
  ON chat_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

-- Create function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, created_at, updated_at)
  VALUES (NEW.id, now(), now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_feedback_conversation_id ON chat_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_ids ON conversations USING GIN(participant_ids);