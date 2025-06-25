import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid VITE_SUPABASE_URL format: ${supabaseUrl}. Expected format: https://your-project-ref.supabase.co`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          display_name: string | null;
          age_range: string | null;
          gender: string | null;
          personality_traits: string[] | null;
          work_status: string | null;
          work_style: string | null;
          food_habits: string | null;
          sleep_duration: number | null;
          relationship_status: string | null;
          communication_style: string | null;
          support_type: string | null;
          availability: string | null;
          mental_health_background: any | null;
          privacy_settings: any | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          display_name?: string | null;
          age_range?: string | null;
          gender?: string | null;
          personality_traits?: string[] | null;
          work_status?: string | null;
          work_style?: string | null;
          food_habits?: string | null;
          sleep_duration?: number | null;
          relationship_status?: string | null;
          communication_style?: string | null;
          support_type?: string | null;
          availability?: string | null;
          mental_health_background?: any | null;
          privacy_settings?: any | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          age_range?: string | null;
          gender?: string | null;
          personality_traits?: string[] | null;
          work_status?: string | null;
          work_style?: string | null;
          food_habits?: string | null;
          sleep_duration?: number | null;
          relationship_status?: string | null;
          communication_style?: string | null;
          support_type?: string | null;
          availability?: string | null;
          mental_health_background?: any | null;
          privacy_settings?: any | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          age_range: string | null;
          emotional_state: string;
          need_tags: string[];
          details: any | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name: string;
          age_range?: string | null;
          emotional_state: string;
          need_tags: string[];
          details?: any | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string;
          age_range?: string | null;
          emotional_state?: string;
          need_tags?: string[];
          details?: any | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          participant_ids: string[];
          type: string;
          started_at: string;
          ended_at: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          participant_ids: string[];
          type: string;
          started_at?: string;
          ended_at?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          participant_ids?: string[];
          type?: string;
          started_at?: string;
          ended_at?: string | null;
          status?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          timestamp: string;
          message_type: string;
          emotion_analysis: any | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          timestamp?: string;
          message_type?: string;
          emotion_analysis?: any | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          timestamp?: string;
          message_type?: string;
          emotion_analysis?: any | null;
        };
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_type: string;
          count: number;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_type: string;
          count?: number;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_type?: string;
          count?: number;
          earned_at?: string;
        };
      };
      chat_feedback: {
        Row: {
          id: string;
          conversation_id: string;
          from_user_id: string;
          to_user_id: string;
          feedback_tags: string[];
          rating: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          from_user_id: string;
          to_user_id: string;
          feedback_tags: string[];
          rating: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          feedback_tags?: string[];
          rating?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};