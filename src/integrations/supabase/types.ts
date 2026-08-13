export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          currency: string
          id: string
          institution: string | null
          is_demo: boolean
          name: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          institution?: string | null
          is_demo?: boolean
          name: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          institution?: string | null
          is_demo?: boolean
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          account_id: string | null
          asset_type: string
          created_at: string
          currency: string
          current_price: number | null
          geography: string | null
          id: string
          is_demo: boolean
          name: string
          notes: string | null
          pricing_mode: string
          sector: string | null
          ticker: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          asset_type?: string
          created_at?: string
          currency?: string
          current_price?: number | null
          geography?: string | null
          id?: string
          is_demo?: boolean
          name: string
          notes?: string | null
          pricing_mode?: string
          sector?: string | null
          ticker?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          asset_type?: string
          created_at?: string
          currency?: string
          current_price?: number | null
          geography?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          notes?: string | null
          pricing_mode?: string
          sector?: string | null
          ticker?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          kind: string
          name: string
          target_amount: number
          target_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          kind?: string
          name: string
          target_amount: number
          target_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          kind?: string
          name?: string
          target_amount?: number
          target_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          account_id: string | null
          asset_id: string | null
          content: string | null
          created_at: string
          date: string
          id: string
          is_demo: boolean
          title: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          asset_id?: string | null
          content?: string | null
          created_at?: string
          date?: string
          id?: string
          is_demo?: boolean
          title: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          asset_id?: string | null
          content?: string | null
          created_at?: string
          date?: string
          id?: string
          is_demo?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          base_currency: string
          concentration_threshold: number
          created_at: string
          display_name: string | null
          has_demo_data: boolean
          id: string
          updated_at: string
        }
        Insert: {
          base_currency?: string
          concentration_threshold?: number
          created_at?: string
          display_name?: string | null
          has_demo_data?: boolean
          id: string
          updated_at?: string
        }
        Update: {
          base_currency?: string
          concentration_threshold?: number
          created_at?: string
          display_name?: string | null
          has_demo_data?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          asset_id: string | null
          created_at: string
          currency: string
          date: string
          fees: number
          id: string
          is_demo: boolean
          notes: string | null
          quantity: number | null
          type: string
          unit_price: number | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          asset_id?: string | null
          created_at?: string
          currency?: string
          date?: string
          fees?: number
          id?: string
          is_demo?: boolean
          notes?: string | null
          quantity?: number | null
          type: string
          unit_price?: number | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          asset_id?: string | null
          created_at?: string
          currency?: string
          date?: string
          fees?: number
          id?: string
          is_demo?: boolean
          notes?: string | null
          quantity?: number | null
          type?: string
          unit_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      valuations: {
        Row: {
          asset_id: string
          created_at: string
          currency: string
          date: string
          id: string
          is_demo: boolean
          price: number
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          currency?: string
          date?: string
          id?: string
          is_demo?: boolean
          price: number
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          currency?: string
          date?: string
          id?: string
          is_demo?: boolean
          price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
