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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          organization_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          organization_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          class_id: string
          created_at: string
          id: string
          pass_type: string
          qr_code: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_email: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          pass_type: string
          qr_code?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_email: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          pass_type?: string
          qr_code?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_email?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          booking_id: string
          checked_in_at: string
          checked_in_by: string | null
          id: string
          qr_code: string | null
        }
        Insert: {
          booking_id: string
          checked_in_at?: string
          checked_in_by?: string | null
          id?: string
          qr_code?: string | null
        }
        Update: {
          booking_id?: string
          checked_in_at?: string
          checked_in_by?: string | null
          id?: string
          qr_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number
          created_at: string
          currency: string
          description: string | null
          end_time: string
          id: string
          instructor: string | null
          name: string
          organization_id: string
          price: number
          start_time: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          currency?: string
          description?: string | null
          end_time: string
          id?: string
          instructor?: string | null
          name: string
          organization_id: string
          price?: number
          start_time: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          currency?: string
          description?: string | null
          end_time?: string
          id?: string
          instructor?: string | null
          name?: string
          organization_id?: string
          price?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          class_credits: number | null
          created_at: string
          currency: string
          description: string | null
          duration_days: number | null
          id: string
          is_recurring: boolean
          name: string
          organization_id: string
          price: number
          type: Database["public"]["Enums"]["membership_type"]
          updated_at: string
        }
        Insert: {
          class_credits?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_recurring?: boolean
          name: string
          organization_id: string
          price?: number
          type?: Database["public"]["Enums"]["membership_type"]
          updated_at?: string
        }
        Update: {
          class_credits?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          is_recurring?: boolean
          name?: string
          organization_id?: string
          price?: number
          type?: Database["public"]["Enums"]["membership_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          allow_waitlist: boolean
          auto_confirm_bookings: boolean
          cancellation_hours: number
          created_at: string
          google_calendar_connected: boolean
          id: string
          organization_id: string
          outlook_calendar_connected: boolean
          require_payment: boolean
          settings: Json
          stripe_account_id: string | null
          stripe_connected: boolean
          updated_at: string
        }
        Insert: {
          allow_waitlist?: boolean
          auto_confirm_bookings?: boolean
          cancellation_hours?: number
          created_at?: string
          google_calendar_connected?: boolean
          id?: string
          organization_id: string
          outlook_calendar_connected?: boolean
          require_payment?: boolean
          settings?: Json
          stripe_account_id?: string | null
          stripe_connected?: boolean
          updated_at?: string
        }
        Update: {
          allow_waitlist?: boolean
          auto_confirm_bookings?: boolean
          cancellation_hours?: number
          created_at?: string
          google_calendar_connected?: boolean
          id?: string
          organization_id?: string
          outlook_calendar_connected?: boolean
          require_payment?: boolean
          settings?: Json
          stripe_account_id?: string | null
          stripe_connected?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          organization_id: string
          payment_type: string
          related_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_customer_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          organization_id: string
          payment_type: string
          related_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          organization_id?: string
          payment_type?: string
          related_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_passes: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          membership_id: string
          organization_id: string
          remaining_credits: number | null
          status: Database["public"]["Enums"]["pass_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          membership_id: string
          organization_id: string
          remaining_credits?: number | null
          status?: Database["public"]["Enums"]["pass_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          membership_id?: string
          organization_id?: string
          remaining_credits?: number | null
          status?: Database["public"]["Enums"]["pass_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_passes_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_passes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          class_id: string
          created_at: string
          id: string
          position: number
          updated_at: string
          user_email: string
          user_name: string
          user_phone: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          position: number
          updated_at?: string
          user_email: string
          user_name: string
          user_phone?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          position?: number
          updated_at?: string
          user_email?: string
          user_name?: string
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_role: {
        Args: { org_id: string; user_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
    }
    Enums: {
      booking_status: "confirmed" | "cancelled" | "waitlist"
      membership_type: "unlimited" | "class_pack" | "trial"
      org_role: "owner" | "admin" | "member"
      pass_status: "active" | "expired" | "suspended"
      payment_status: "pending" | "completed" | "failed" | "refunded"
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
      booking_status: ["confirmed", "cancelled", "waitlist"],
      membership_type: ["unlimited", "class_pack", "trial"],
      org_role: ["owner", "admin", "member"],
      pass_status: ["active", "expired", "suspended"],
      payment_status: ["pending", "completed", "failed", "refunded"],
    },
  },
} as const
