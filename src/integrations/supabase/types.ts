export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      collection_events: {
        Row: {
          created_at: string | null
          date: string
          id: string
          location: string
          participants: number | null
          status: string
          time_range: string | null
          title: string
          waste_large: number | null
          waste_medium: number | null
          waste_small: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          location: string
          participants?: number | null
          status?: string
          time_range?: string | null
          title: string
          waste_large?: number | null
          waste_medium?: number | null
          waste_small?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          location?: string
          participants?: number | null
          status?: string
          time_range?: string | null
          title?: string
          waste_large?: number | null
          waste_medium?: number | null
          waste_small?: number | null
        }
        Relationships: []
      }
      redeemed_rewards: {
        Row: {
          created_at: string | null
          id: string
          reward_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reward_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reward_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redeemed_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          available: boolean | null
          created_at: string | null
          description: string
          id: string
          image_url: string
          title: string
          token_cost: number
        }
        Insert: {
          available?: boolean | null
          created_at?: string | null
          description: string
          id?: string
          image_url: string
          title: string
          token_cost: number
        }
        Update: {
          available?: boolean | null
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string
          title?: string
          token_cost?: number
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          source_id: string | null
          source_type: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          source_id?: string | null
          source_type: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          source_id?: string | null
          source_type?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          location: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          collection_events: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          new_waste_reports: boolean | null
          token_rewards: boolean | null
          updated_at: string | null
          weekly_summary: boolean | null
        }
        Insert: {
          collection_events?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id: string
          new_waste_reports?: boolean | null
          token_rewards?: boolean | null
          updated_at?: string | null
          weekly_summary?: boolean | null
        }
        Update: {
          collection_events?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          new_waste_reports?: boolean | null
          token_rewards?: boolean | null
          updated_at?: string | null
          weekly_summary?: boolean | null
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          level: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          level?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          level?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      waste_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          location: string
          status: string
          title: string
          updated_at: string
          user_id: string
          waste_size: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          waste_size: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          waste_size?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_admin_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
