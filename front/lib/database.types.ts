export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          learning_preferences: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          learning_preferences?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          learning_preferences?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_groups: {
        Row: {
          id: string;
          profile_id: string;
          title: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          title?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          english_text: string;
          japanese_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          english_text: string;
          japanese_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          english_text?: string;
          japanese_text?: string;
          created_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: "user" | "assistant";
          content?: string;
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
}
