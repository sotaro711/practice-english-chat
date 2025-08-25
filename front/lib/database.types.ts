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
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          chat_group_id: string;
          role: "user" | "assistant";
          content: string;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_group_id: string;
          role: "user" | "assistant";
          content: string;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_group_id?: string;
          role?: "user" | "assistant";
          content?: string;
          metadata?: any;
          created_at?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          profile_id: string;
          chat_message_id: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          chat_message_id: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          chat_message_id?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      user_bookmarks_view: {
        Row: {
          bookmark_id: string;
          profile_id: string;
          notes: string | null;
          bookmarked_at: string;
          chat_message_id: string;
          message_content: string;
          message_role: "user" | "assistant";
          message_metadata: any;
          chat_group_id: string;
          chat_group_name: string;
          chat_group_description: string | null;
        };
      };
      chat_group_summary_view: {
        Row: {
          chat_group_id: string;
          profile_id: string;
          chat_group_name: string;
          description: string | null;
          is_active: boolean;
          group_created_at: string;
          group_updated_at: string;
          message_count: number;
          last_message_at: string | null;
          last_message_content: string;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
