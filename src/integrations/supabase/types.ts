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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_allowlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      brokers: {
        Row: {
          created_at: string
          creci: string | null
          email: string | null
          id: string
          monthly_expenses: number
          name: string
          phone: string | null
          total_listings: number
          total_sales: number
          total_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creci?: string | null
          email?: string | null
          id?: string
          monthly_expenses?: number
          name: string
          phone?: string | null
          total_listings?: number
          total_sales?: number
          total_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creci?: string | null
          email?: string | null
          id?: string
          monthly_expenses?: number
          name?: string
          phone?: string | null
          total_listings?: number
          total_sales?: number
          total_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          broker_id: string
          client_name: string
          created_at: string
          id: string
          interest: string
          is_active: boolean
          negotiation_status: string
          status_color: string
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_id: string
          client_name: string
          created_at?: string
          id?: string
          interest: string
          is_active?: boolean
          negotiation_status: string
          status_color?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_id?: string
          client_name?: string
          created_at?: string
          id?: string
          interest?: string
          is_active?: boolean
          negotiation_status?: string
          status_color?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_broker"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          datetime: string
          description: string | null
          duration_minutes: number | null
          id: string
          priority: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          datetime: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          priority?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          datetime?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          priority?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          flag_key: string
          id: string
          is_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          flag_key: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          flag_key?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          broker_id: string
          created_at: string
          current_value: number
          description: string | null
          end_date: string
          goal_type: string
          id: string
          priority: string
          start_date: string
          status: string
          target_value: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_id: string
          created_at?: string
          current_value?: number
          description?: string | null
          end_date: string
          goal_type: string
          id?: string
          priority?: string
          start_date: string
          status?: string
          target_value: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_id?: string
          created_at?: string
          current_value?: number
          description?: string | null
          end_date?: string
          goal_type?: string
          id?: string
          priority?: string
          start_date?: string
          status?: string
          target_value?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_challenges: {
        Row: {
          broker_id: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          priority: string
          start_date: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_id: string
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          priority?: string
          start_date: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_id?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          priority?: string
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_challenges_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_targets: {
        Row: {
          challenge_id: string
          created_at: string
          current_value: number
          id: string
          metric_type: string
          target_value: number
          updated_at: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          current_value?: number
          id?: string
          metric_type: string
          target_value: number
          updated_at?: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          current_value?: number
          id?: string
          metric_type?: string
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_targets_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "performance_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          broker_id: string
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          broker_id: string
          category: string
          created_at?: string
          description: string
          expense_date: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          broker_id?: string
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          broker_id: string
          created_at: string
          id: string
          listing_date: string
          owner_name: string
          property_address: string
          property_value: number
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_id: string
          created_at?: string
          id?: string
          listing_date: string
          owner_name: string
          property_address: string
          property_value: number
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_id?: string
          created_at?: string
          id?: string
          listing_date?: string
          owner_name?: string
          property_address?: string
          property_value?: number
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          broker_id: string
          client_name: string
          created_at: string
          id: string
          meeting_date: string
          meeting_type: string
          notes: string | null
          status: string
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_id: string
          client_name: string
          created_at?: string
          id?: string
          meeting_date: string
          meeting_type: string
          notes?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_id?: string
          client_name?: string
          created_at?: string
          id?: string
          meeting_date?: string
          meeting_type?: string
          notes?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          broker_id: string
          client_name: string
          commission: number
          created_at: string
          id: string
          property_address: string
          sale_date: string
          sale_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_id: string
          client_name: string
          commission: number
          created_at?: string
          id?: string
          property_address: string
          sale_date: string
          sale_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_id?: string
          client_name?: string
          commission?: number
          created_at?: string
          id?: string
          property_address?: string
          sale_date?: string
          sale_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          broker_id: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          priority: string
          related_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          priority?: string
          related_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          priority?: string
          related_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          user_id: string
          broker_id: string
          title: string
          description: string | null
          goal_type: string
          target_value: number
          current_value: number
          start_date: string
          end_date: string
          status: string
          priority: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          broker_id: string
          title: string
          description?: string | null
          goal_type: string
          target_value: number
          current_value?: number
          start_date: string
          end_date: string
          status?: string
          priority?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          broker_id?: string
          title?: string
          description?: string | null
          goal_type?: string
          target_value?: number
          current_value?: number
          start_date?: string
          end_date?: string
          status?: string
          priority?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      performance_challenges: {
        Row: {
          id: string
          broker_id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          broker_id: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          broker_id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          id: string
          challenge_id: string
          type: string
          target_value: number
          current_value: number
          unit: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          type: string
          target_value: number
          current_value?: number
          unit: string
          color: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          type?: string
          target_value?: number
          current_value?: number
          unit?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_all_goals: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "broker" | "viewer"
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
    Enums: {
      app_role: ["admin", "manager", "broker", "viewer"],
    },
  },
} as const
