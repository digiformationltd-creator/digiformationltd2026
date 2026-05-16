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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      client_addresses: {
        Row: {
          activation_code: string | null
          address_line1: string | null
          address_line2: string | null
          auth_code: string | null
          city: string | null
          country: string | null
          county: string | null
          created_at: string
          expire_date: string | null
          id: string
          label: string
          notes: string | null
          postcode: string | null
          service_type: string
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
          utr_number: string | null
        }
        Insert: {
          activation_code?: string | null
          address_line1?: string | null
          address_line2?: string | null
          auth_code?: string | null
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string
          expire_date?: string | null
          id?: string
          label: string
          notes?: string | null
          postcode?: string | null
          service_type?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
          utr_number?: string | null
        }
        Update: {
          activation_code?: string | null
          address_line1?: string | null
          address_line2?: string | null
          auth_code?: string | null
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string
          expire_date?: string | null
          id?: string
          label?: string
          notes?: string | null
          postcode?: string | null
          service_type?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          utr_number?: string | null
        }
        Relationships: []
      }
      client_company_details: {
        Row: {
          accounts_filing_due: string | null
          activation_code: string | null
          address_expire: string | null
          address_start: string | null
          auth_code: string | null
          company_address: string | null
          company_name: string | null
          company_number: string | null
          confirmation_due: string | null
          correspondence_address: string | null
          created_at: string
          director_name: string | null
          id: string
          incorporation_date: string | null
          registered_address: string | null
          sic_code: string | null
          updated_at: string
          user_id: string
          utr_number: string | null
        }
        Insert: {
          accounts_filing_due?: string | null
          activation_code?: string | null
          address_expire?: string | null
          address_start?: string | null
          auth_code?: string | null
          company_address?: string | null
          company_name?: string | null
          company_number?: string | null
          confirmation_due?: string | null
          correspondence_address?: string | null
          created_at?: string
          director_name?: string | null
          id?: string
          incorporation_date?: string | null
          registered_address?: string | null
          sic_code?: string | null
          updated_at?: string
          user_id: string
          utr_number?: string | null
        }
        Update: {
          accounts_filing_due?: string | null
          activation_code?: string | null
          address_expire?: string | null
          address_start?: string | null
          auth_code?: string | null
          company_address?: string | null
          company_name?: string | null
          company_number?: string | null
          confirmation_due?: string | null
          correspondence_address?: string | null
          created_at?: string
          director_name?: string | null
          id?: string
          incorporation_date?: string | null
          registered_address?: string | null
          sic_code?: string | null
          updated_at?: string
          user_id?: string
          utr_number?: string | null
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          address_id: string | null
          created_at: string
          doc_date: string
          file_size: string | null
          file_type: string | null
          file_url: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          doc_date?: string
          file_size?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          address_id?: string | null
          created_at?: string
          doc_date?: string
          file_size?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      client_orders: {
        Row: {
          amount_gbp: number
          created_at: string
          id: string
          order_date: string
          order_ref: string
          service: string
          status: string
          user_id: string
        }
        Insert: {
          amount_gbp?: number
          created_at?: string
          id?: string
          order_date?: string
          order_ref: string
          service: string
          status?: string
          user_id: string
        }
        Update: {
          amount_gbp?: number
          created_at?: string
          id?: string
          order_date?: string
          order_ref?: string
          service?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      client_subscriptions: {
        Row: {
          created_at: string
          id: string
          next_billing: string | null
          period: string
          plan_name: string
          price_gbp: number
          renewal_date: string | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_billing?: string | null
          period?: string
          plan_name: string
          price_gbp?: number
          renewal_date?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          next_billing?: string | null
          period?: string
          plan_name?: string
          price_gbp?: number
          renewal_date?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          replies_count: number
          status: string
          subject: string
          ticket_ref: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          replies_count?: number
          status?: string
          subject: string
          ticket_ref: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          replies_count?: number
          status?: string
          subject?: string
          ticket_ref?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_wallet_transactions: {
        Row: {
          amount_gbp: number
          created_at: string
          description: string
          id: string
          txn_date: string
          txn_ref: string
          txn_type: string
          user_id: string
        }
        Insert: {
          amount_gbp: number
          created_at?: string
          description: string
          id?: string
          txn_date?: string
          txn_ref: string
          txn_type: string
          user_id: string
        }
        Update: {
          amount_gbp?: number
          created_at?: string
          description?: string
          id?: string
          txn_date?: string
          txn_ref?: string
          txn_type?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          country: string
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          page_path: string | null
          referrer: string | null
          service: string
          user_agent: string | null
          whatsapp: string
        }
        Insert: {
          country: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          page_path?: string | null
          referrer?: string | null
          service: string
          user_agent?: string | null
          whatsapp: string
        }
        Update: {
          country?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          page_path?: string | null
          referrer?: string | null
          service?: string
          user_agent?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      email_reminder_log: {
        Row: {
          due_date: string
          id: string
          recipient_email: string
          reminder_type: string
          sent_at: string
          stage: number
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          due_date: string
          id?: string
          recipient_email: string
          reminder_type: string
          sent_at?: string
          stage: number
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          due_date?: string
          id?: string
          recipient_email?: string
          reminder_type?: string
          sent_at?: string
          stage?: number
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_gbp: number
          bill_to_address: string | null
          bill_to_email: string | null
          bill_to_name: string | null
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          order_id: string | null
          pdf_url: string | null
          service_code: string
          service_description: string
          status: string
          total_gbp: number
          updated_at: string
          user_id: string
          vat_gbp: number
          vat_rate: number
        }
        Insert: {
          amount_gbp?: number
          bill_to_address?: string | null
          bill_to_email?: string | null
          bill_to_name?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          order_id?: string | null
          pdf_url?: string | null
          service_code?: string
          service_description: string
          status?: string
          total_gbp?: number
          updated_at?: string
          user_id: string
          vat_gbp?: number
          vat_rate?: number
        }
        Update: {
          amount_gbp?: number
          bill_to_address?: string | null
          bill_to_email?: string | null
          bill_to_name?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          order_id?: string | null
          pdf_url?: string | null
          service_code?: string
          service_description?: string
          status?: string
          total_gbp?: number
          updated_at?: string
          user_id?: string
          vat_gbp?: number
          vat_rate?: number
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_initials: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_initials?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_initials?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      us_llc_state_pricing: {
        Row: {
          created_at: string
          display_order: number
          gold_price_usd: number
          id: string
          is_popular: boolean
          notes: string | null
          silver_price_usd: number
          starter_price_usd: number
          state_code: string
          state_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          gold_price_usd?: number
          id?: string
          is_popular?: boolean
          notes?: string | null
          silver_price_usd?: number
          starter_price_usd?: number
          state_code: string
          state_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          gold_price_usd?: number
          id?: string
          is_popular?: boolean
          notes?: string | null
          silver_price_usd?: number
          starter_price_usd?: number
          state_code?: string
          state_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_clicks: {
        Row: {
          created_at: string
          id: string
          page_path: string | null
          referrer: string | null
          source: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_path?: string | null
          referrer?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string | null
          referrer?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      next_order_number: { Args: never; Returns: number }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "client"
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
      app_role: ["admin", "client"],
    },
  },
} as const
