/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `display_name` (text, nullable)
      - `age_range` (text, nullable)
      - `gender` (text, nullable)
      - `personality_traits` (text array, nullable)
      - `work_status` (text, nullable)
      - `work_style` (text, nullable)
      - `food_habits` (text, nullable)
      - `sleep_duration` (numeric, nullable)
      - `relationship_status` (text, nullable)
      - `communication_style` (text, nullable)
      - `support_type` (text, nullable)
      - `availability` (text, nullable)
      - `mental_health_background` (jsonb, nullable)
      - `privacy_settings` (jsonb, nullable)
      - `onboarding_completed` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read their own data
    - Add policy for users to update their own data
    - Add policy for users to insert their own data

  3. Functions
    - Create trigger function to automatically update `updated_at` timestamp
*/

CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    age_range text,
    gender text,
    personality_traits text[],
    work_status text,
    work_style text,
    food_habits text,
    sleep_duration numeric,
    relationship_status text,
    communication_style text,
    support_type text,
    availability text,
    mental_health_background jsonb,
    privacy_settings jsonb,
    onboarding_completed boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();