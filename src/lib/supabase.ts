import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'mindspace-app'
    }
  }
})

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