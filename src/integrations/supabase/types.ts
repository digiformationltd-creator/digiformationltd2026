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
      agent_audit_log: {
        Row: {
          action: string
          agent_name: string
          amount_gbp: number | null
          checkout_request_id: string | null
          created_at: string
          customer_email: string | null
          error_message: string | null
          flags: Json
          id: string
          invoice_number: string | null
          ip_address: string | null
          order_id: string | null
          order_ref: string | null
          request_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          service_slug: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          action: string
          agent_name?: string
          amount_gbp?: number | null
          checkout_request_id?: string | null
          created_at?: string
          customer_email?: string | null
          error_message?: string | null
          flags?: Json
          id?: string
          invoice_number?: string | null
          ip_address?: string | null
          order_id?: string | null
          order_ref?: string | null
          request_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          service_slug?: string | null
          status: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          agent_name?: string
          amount_gbp?: number | null
          checkout_request_id?: string | null
          created_at?: string
          customer_email?: string | null
          error_message?: string | null
          flags?: Json
          id?: string
          invoice_number?: string | null
          ip_address?: string | null
          order_id?: string | null
          order_ref?: string | null
          request_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          service_slug?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          conditions: Json
          created_at: string
          id: string
          is_enabled: boolean
          name: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          conditions?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          name: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          conditions?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          name?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          id: string
          job_name: string
          kind: string
          payload: Json | null
          started_at: string
          status: string
          triggered_by: string | null
        }
        Insert: {
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          job_name: string
          kind?: string
          payload?: Json | null
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Update: {
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          job_name?: string
          kind?: string
          payload?: Json | null
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      cleanup_audit_log: {
        Row: {
          category: string
          created_at: string
          details: Json | null
          error: string | null
          id: string
          removed_count: number
          run_at: string
        }
        Insert: {
          category: string
          created_at?: string
          details?: Json | null
          error?: string | null
          id?: string
          removed_count?: number
          run_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          details?: Json | null
          error?: string | null
          id?: string
          removed_count?: number
          run_at?: string
        }
        Relationships: []
      }
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
          companies_house_personal_code: string | null
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
          companies_house_personal_code?: string | null
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
          companies_house_personal_code?: string | null
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
          amount_mismatch: boolean
          attribution_id: string | null
          checkout_request_id: string | null
          client_ip: string | null
          country_code: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone_e164: string | null
          customer_whatsapp: string | null
          declared_source: string | null
          declared_source_label: string | null
          id: string
          inquiry_id: string | null
          notes: string | null
          order_date: string
          order_ref: string
          payment_status: string
          preferred_contact_method: string | null
          service: string
          source: string
          status: string
          user_id: string | null
          utm_campaign: string | null
          utm_source: string | null
        }
        Insert: {
          amount_gbp?: number
          amount_mismatch?: boolean
          attribution_id?: string | null
          checkout_request_id?: string | null
          client_ip?: string | null
          country_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone_e164?: string | null
          customer_whatsapp?: string | null
          declared_source?: string | null
          declared_source_label?: string | null
          id?: string
          inquiry_id?: string | null
          notes?: string | null
          order_date?: string
          order_ref: string
          payment_status?: string
          preferred_contact_method?: string | null
          service: string
          source?: string
          status?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Update: {
          amount_gbp?: number
          amount_mismatch?: boolean
          attribution_id?: string | null
          checkout_request_id?: string | null
          client_ip?: string | null
          country_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone_e164?: string | null
          customer_whatsapp?: string | null
          declared_source?: string | null
          declared_source_label?: string | null
          id?: string
          inquiry_id?: string | null
          notes?: string | null
          order_date?: string
          order_ref?: string
          payment_status?: string
          preferred_contact_method?: string | null
          service?: string
          source?: string
          status?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_orders_attribution_id_fkey"
            columns: ["attribution_id"]
            isOneToOne: false
            referencedRelation: "lead_attribution"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_orders_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
        ]
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
      command_actions: {
        Row: {
          admin_id: string | null
          after_snapshot: Json | null
          approved_at: string | null
          before_snapshot: Json | null
          created_at: string
          error: string | null
          executed_at: string | null
          id: string
          intent: string
          payload: Json | null
          preview: Json | null
          prompt: string | null
          result: Json | null
          risk_tier: string
          rolled_back_at: string | null
          rolled_back_by: string | null
          state: string
          status: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          admin_id?: string | null
          after_snapshot?: Json | null
          approved_at?: string | null
          before_snapshot?: Json | null
          created_at?: string
          error?: string | null
          executed_at?: string | null
          id?: string
          intent: string
          payload?: Json | null
          preview?: Json | null
          prompt?: string | null
          result?: Json | null
          risk_tier?: string
          rolled_back_at?: string | null
          rolled_back_by?: string | null
          state?: string
          status?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          admin_id?: string | null
          after_snapshot?: Json | null
          approved_at?: string | null
          before_snapshot?: Json | null
          created_at?: string
          error?: string | null
          executed_at?: string | null
          id?: string
          intent?: string
          payload?: Json | null
          preview?: Json | null
          prompt?: string | null
          result?: Json | null
          risk_tier?: string
          rolled_back_at?: string | null
          rolled_back_by?: string | null
          state?: string
          status?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          attribution_id: string | null
          country: string
          created_at: string
          declared_source: string | null
          declared_source_label: string | null
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
          attribution_id?: string | null
          country: string
          created_at?: string
          declared_source?: string | null
          declared_source_label?: string | null
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
          attribution_id?: string | null
          country?: string
          created_at?: string
          declared_source?: string | null
          declared_source_label?: string | null
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
        Relationships: [
          {
            foreignKeyName: "contact_submissions_attribution_id_fkey"
            columns: ["attribution_id"]
            isOneToOne: false
            referencedRelation: "lead_attribution"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience_filter: Json
          clicked_count: number
          created_at: string
          created_by: string | null
          id: string
          name: string
          opened_count: number
          scheduled_at: string | null
          sent_count: number
          status: string
          subject: string
          template_name: string | null
          updated_at: string
        }
        Insert: {
          audience_filter?: Json
          clicked_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          opened_count?: number
          scheduled_at?: string | null
          sent_count?: number
          status?: string
          subject: string
          template_name?: string | null
          updated_at?: string
        }
        Update: {
          audience_filter?: Json
          clicked_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          opened_count?: number
          scheduled_at?: string | null
          sent_count?: number
          status?: string
          subject?: string
          template_name?: string | null
          updated_at?: string
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          client_user_id: string | null
          created_at: string
          error_message: string | null
          id: string
          invoice_id: string | null
          message_id: string | null
          metadata: Json | null
          order_id: string | null
          recipient_email: string
          status: string
          template_name: string
          ticket_id: string | null
          trigger_source: string | null
          triggered_by_ip: string | null
          triggered_by_user_id: string | null
        }
        Insert: {
          client_user_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          message_id?: string | null
          metadata?: Json | null
          order_id?: string | null
          recipient_email: string
          status: string
          template_name: string
          ticket_id?: string | null
          trigger_source?: string | null
          triggered_by_ip?: string | null
          triggered_by_user_id?: string | null
        }
        Update: {
          client_user_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          message_id?: string | null
          metadata?: Json | null
          order_id?: string | null
          recipient_email?: string
          status?: string
          template_name?: string
          ticket_id?: string | null
          trigger_source?: string | null
          triggered_by_ip?: string | null
          triggered_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_send_log_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_send_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "client_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_send_log_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "client_tickets"
            referencedColumns: ["id"]
          },
        ]
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
          amount_mismatch: boolean
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
          user_id: string | null
          vat_gbp: number
          vat_rate: number
        }
        Insert: {
          amount_gbp?: number
          amount_mismatch?: boolean
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
          user_id?: string | null
          vat_gbp?: number
          vat_rate?: number
        }
        Update: {
          amount_gbp?: number
          amount_mismatch?: boolean
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
          user_id?: string | null
          vat_gbp?: number
          vat_rate?: number
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lead_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: []
      }
      lead_attribution: {
        Row: {
          browser: string | null
          converted_at: string
          country: string | null
          created_at: string
          declared_category: string | null
          declared_source: string | null
          declared_source_label: string | null
          device_type: string | null
          entity_id: string
          entity_type: string
          first_campaign: string | null
          first_category: string | null
          first_landing_page: string | null
          first_referrer: string | null
          first_source: string | null
          id: string
          last_campaign: string | null
          last_category: string | null
          last_landing_page: string | null
          last_referrer: string | null
          last_source: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          converted_at?: string
          country?: string | null
          created_at?: string
          declared_category?: string | null
          declared_source?: string | null
          declared_source_label?: string | null
          device_type?: string | null
          entity_id: string
          entity_type: string
          first_campaign?: string | null
          first_category?: string | null
          first_landing_page?: string | null
          first_referrer?: string | null
          first_source?: string | null
          id?: string
          last_campaign?: string | null
          last_category?: string | null
          last_landing_page?: string | null
          last_referrer?: string | null
          last_source?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          converted_at?: string
          country?: string | null
          created_at?: string
          declared_category?: string | null
          declared_source?: string | null
          declared_source_label?: string | null
          device_type?: string | null
          entity_id?: string
          entity_type?: string
          first_campaign?: string | null
          first_category?: string | null
          first_landing_page?: string | null
          first_referrer?: string | null
          first_source?: string | null
          id?: string
          last_campaign?: string | null
          last_category?: string | null
          last_landing_page?: string | null
          last_referrer?: string | null
          last_source?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          attribution_id: string | null
          country: string | null
          country_code: string | null
          created_at: string
          created_by: string | null
          declared_source: string | null
          declared_source_label: string | null
          email: string | null
          follow_up_date: string | null
          id: string
          name: string
          notes: string | null
          phone_e164: string | null
          position: number
          preferred_contact_method: string | null
          service: string | null
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
          value_gbp: number
          whatsapp: string | null
        }
        Insert: {
          assigned_to?: string | null
          attribution_id?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          declared_source?: string | null
          declared_source_label?: string | null
          email?: string | null
          follow_up_date?: string | null
          id?: string
          name: string
          notes?: string | null
          phone_e164?: string | null
          position?: number
          preferred_contact_method?: string | null
          service?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          value_gbp?: number
          whatsapp?: string | null
        }
        Update: {
          assigned_to?: string | null
          attribution_id?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          declared_source?: string | null
          declared_source_label?: string | null
          email?: string | null
          follow_up_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone_e164?: string | null
          position?: number
          preferred_contact_method?: string | null
          service?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          value_gbp?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_attribution_id_fkey"
            columns: ["attribution_id"]
            isOneToOne: false
            referencedRelation: "lead_attribution"
            referencedColumns: ["id"]
          },
        ]
      }
      managed_companies: {
        Row: {
          accounts_filing_due: string | null
          ad01_filing_date: string | null
          address_expire: string | null
          address_status: string | null
          auth_code: string | null
          ch_address: string | null
          company_name: string
          company_number: string | null
          confirmation_due: string | null
          created_at: string
          director: string | null
          id: string
          imported_batch: string | null
          incorporation_date: string | null
          notes: string | null
          original_director: string | null
          previous_address: string | null
          previous_name: string | null
          raw_status: string | null
          registered_address: string | null
          sic_code: string | null
          status: Database["public"]["Enums"]["managed_company_status"]
          updated_at: string
          utr_number: string | null
        }
        Insert: {
          accounts_filing_due?: string | null
          ad01_filing_date?: string | null
          address_expire?: string | null
          address_status?: string | null
          auth_code?: string | null
          ch_address?: string | null
          company_name: string
          company_number?: string | null
          confirmation_due?: string | null
          created_at?: string
          director?: string | null
          id?: string
          imported_batch?: string | null
          incorporation_date?: string | null
          notes?: string | null
          original_director?: string | null
          previous_address?: string | null
          previous_name?: string | null
          raw_status?: string | null
          registered_address?: string | null
          sic_code?: string | null
          status?: Database["public"]["Enums"]["managed_company_status"]
          updated_at?: string
          utr_number?: string | null
        }
        Update: {
          accounts_filing_due?: string | null
          ad01_filing_date?: string | null
          address_expire?: string | null
          address_status?: string | null
          auth_code?: string | null
          ch_address?: string | null
          company_name?: string
          company_number?: string | null
          confirmation_due?: string | null
          created_at?: string
          director?: string | null
          id?: string
          imported_batch?: string | null
          incorporation_date?: string | null
          notes?: string | null
          original_director?: string | null
          previous_address?: string | null
          previous_name?: string | null
          raw_status?: string | null
          registered_address?: string | null
          sic_code?: string | null
          status?: Database["public"]["Enums"]["managed_company_status"]
          updated_at?: string
          utr_number?: string | null
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
      popup_dismissals: {
        Row: {
          action: string
          created_at: string
          declared_source: string | null
          id: string
          popup_key: string
          visitor_id: string
        }
        Insert: {
          action: string
          created_at?: string
          declared_source?: string | null
          id?: string
          popup_key?: string
          visitor_id: string
        }
        Update: {
          action?: string
          created_at?: string
          declared_source?: string | null
          id?: string
          popup_key?: string
          visitor_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_initials: string | null
          company_name: string | null
          country_code: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          phone_e164: string | null
          preferred_contact_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_initials?: string | null
          company_name?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_e164?: string | null
          preferred_contact_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_initials?: string | null
          company_name?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_e164?: string | null
          preferred_contact_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string | null
          created_at: string
          currency: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          price_gbp: number
          slug: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          price_gbp?: number
          slug?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          price_gbp?: number
          slug?: string | null
          updated_at?: string
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
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          related_lead_id: string | null
          related_order_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          related_lead_id?: string | null
          related_order_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          related_lead_id?: string | null
          related_order_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          department: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          job_title: string | null
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
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
      visitor_attribution: {
        Row: {
          country: string | null
          device_type: string | null
          first_campaign: string | null
          first_category: string | null
          first_landing_page: string | null
          first_referrer: string | null
          first_source: string | null
          first_visit_at: string
          last_campaign: string | null
          last_category: string | null
          last_landing_page: string | null
          last_referrer: string | null
          last_source: string | null
          last_visit_at: string
          session_count: number
          total_pages: number
          updated_at: string
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          country?: string | null
          device_type?: string | null
          first_campaign?: string | null
          first_category?: string | null
          first_landing_page?: string | null
          first_referrer?: string | null
          first_source?: string | null
          first_visit_at?: string
          last_campaign?: string | null
          last_category?: string | null
          last_landing_page?: string | null
          last_referrer?: string | null
          last_source?: string | null
          last_visit_at?: string
          session_count?: number
          total_pages?: number
          updated_at?: string
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          country?: string | null
          device_type?: string | null
          first_campaign?: string | null
          first_category?: string | null
          first_landing_page?: string | null
          first_referrer?: string | null
          first_source?: string | null
          first_visit_at?: string
          last_campaign?: string | null
          last_category?: string | null
          last_landing_page?: string | null
          last_referrer?: string | null
          last_source?: string | null
          last_visit_at?: string
          session_count?: number
          total_pages?: number
          updated_at?: string
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      visitor_sessions: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          detected_category: string | null
          detected_source: string | null
          device_type: string | null
          id: string
          landing_page: string | null
          pages_viewed: number
          referrer: string | null
          session_started_at: string
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          detected_category?: string | null
          detected_source?: string | null
          device_type?: string | null
          id?: string
          landing_page?: string | null
          pages_viewed?: number
          referrer?: string | null
          session_started_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          detected_category?: string | null
          detected_source?: string | null
          device_type?: string | null
          id?: string
          landing_page?: string | null
          pages_viewed?: number
          referrer?: string | null
          session_started_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      whatsapp_broadcast_recipients: {
        Row: {
          broadcast_id: string
          contact_id: string
          created_at: string
          error_message: string | null
          id: string
          sent_at: string | null
          status: string
          wa_message_id: string | null
        }
        Insert: {
          broadcast_id: string
          contact_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          wa_message_id?: string | null
        }
        Update: {
          broadcast_id?: string
          contact_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_broadcast_recipients_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_broadcasts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_broadcast_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_broadcasts: {
        Row: {
          audience_filter: Json
          blocked_by_cooldown: number
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          name: string
          scheduled_at: string | null
          sent_count: number
          status: Database["public"]["Enums"]["whatsapp_broadcast_status"]
          template_id: string
          total_recipients: number
          updated_at: string
        }
        Insert: {
          audience_filter?: Json
          blocked_by_cooldown?: number
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          name: string
          scheduled_at?: string | null
          sent_count?: number
          status?: Database["public"]["Enums"]["whatsapp_broadcast_status"]
          template_id: string
          total_recipients?: number
          updated_at?: string
        }
        Update: {
          audience_filter?: Json
          blocked_by_cooldown?: number
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_count?: number
          status?: Database["public"]["Enums"]["whatsapp_broadcast_status"]
          template_id?: string
          total_recipients?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_broadcasts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
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
      whatsapp_consent_events: {
        Row: {
          contact_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json
          source: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          source?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_consent_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          last_broadcast_at: string | null
          last_inbound_at: string | null
          last_outbound_at: string | null
          notes: string | null
          opt_in_at: string | null
          opt_in_status: Database["public"]["Enums"]["whatsapp_opt_in_status"]
          opt_out_at: string | null
          phone_e164: string
          source: string
          tags: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_broadcast_at?: string | null
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          notes?: string | null
          opt_in_at?: string | null
          opt_in_status?: Database["public"]["Enums"]["whatsapp_opt_in_status"]
          opt_out_at?: string | null
          phone_e164: string
          source?: string
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_broadcast_at?: string | null
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          notes?: string | null
          opt_in_at?: string | null
          opt_in_status?: Database["public"]["Enums"]["whatsapp_opt_in_status"]
          opt_out_at?: string | null
          phone_e164?: string
          source?: string
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_message_log: {
        Row: {
          category:
            | Database["public"]["Enums"]["whatsapp_template_category"]
            | null
          contact_id: string | null
          created_at: string
          direction: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          payload: Json | null
          provider: string
          provider_response: Json | null
          recipient_phone: string
          recipient_user_id: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          related_id: string | null
          related_type: string | null
          sent_at: string | null
          status: string
          template_name: string
          wa_message_id: string | null
        }
        Insert: {
          category?:
            | Database["public"]["Enums"]["whatsapp_template_category"]
            | null
          contact_id?: string | null
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          payload?: Json | null
          provider?: string
          provider_response?: Json | null
          recipient_phone: string
          recipient_user_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          status?: string
          template_name: string
          wa_message_id?: string | null
        }
        Update: {
          category?:
            | Database["public"]["Enums"]["whatsapp_template_category"]
            | null
          contact_id?: string | null
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          payload?: Json | null
          provider?: string
          provider_response?: Json | null
          recipient_phone?: string
          recipient_user_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          status?: string
          template_name?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          body_text: string | null
          category: Database["public"]["Enums"]["whatsapp_template_category"]
          created_at: string
          id: string
          language: string
          last_synced_at: string | null
          meta_template_id: string | null
          name: string
          status: Database["public"]["Enums"]["whatsapp_template_status"]
          updated_at: string
          variables: Json
        }
        Insert: {
          body_text?: string | null
          category?: Database["public"]["Enums"]["whatsapp_template_category"]
          created_at?: string
          id?: string
          language?: string
          last_synced_at?: string | null
          meta_template_id?: string | null
          name: string
          status?: Database["public"]["Enums"]["whatsapp_template_status"]
          updated_at?: string
          variables?: Json
        }
        Update: {
          body_text?: string | null
          category?: Database["public"]["Enums"]["whatsapp_template_category"]
          created_at?: string
          id?: string
          language?: string
          last_synced_at?: string | null
          meta_template_id?: string | null
          name?: string
          status?: Database["public"]["Enums"]["whatsapp_template_status"]
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      whatsapp_threads: {
        Row: {
          contact_name: string | null
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          phone: string
          related_lead_id: string | null
          related_user_id: string | null
          status: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          phone: string
          related_lead_id?: string | null
          related_user_id?: string | null
          status?: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          phone?: string
          related_lead_id?: string | null
          related_user_id?: string | null
          status?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attribution_ai_breakdown: {
        Args: { _since?: string }
        Returns: {
          conv_rate: number
          leads: number
          orders: number
          revenue: number
          source: string
        }[]
      }
      attribution_totals_by_source: {
        Args: { _since?: string }
        Returns: {
          aov: number
          category: string
          conv_rate: number
          leads: number
          orders: number
          revenue: number
          source: string
        }[]
      }
      automation_runs_recent: {
        Args: { _limit?: number }
        Returns: {
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          id: string
          job_name: string
          kind: string
          payload: Json | null
          started_at: string
          status: string
          triggered_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "automation_runs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      command_action_preview: {
        Args: { _intent: string; _payload: Json; _prompt?: string }
        Returns: {
          admin_id: string | null
          after_snapshot: Json | null
          approved_at: string | null
          before_snapshot: Json | null
          created_at: string
          error: string | null
          executed_at: string | null
          id: string
          intent: string
          payload: Json | null
          preview: Json | null
          prompt: string | null
          result: Json | null
          risk_tier: string
          rolled_back_at: string | null
          rolled_back_by: string | null
          state: string
          status: string
          target_id: string | null
          target_type: string | null
        }
        SetofOptions: {
          from: "*"
          to: "command_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      command_action_reject: {
        Args: { _id: string }
        Returns: {
          admin_id: string | null
          after_snapshot: Json | null
          approved_at: string | null
          before_snapshot: Json | null
          created_at: string
          error: string | null
          executed_at: string | null
          id: string
          intent: string
          payload: Json | null
          preview: Json | null
          prompt: string | null
          result: Json | null
          risk_tier: string
          rolled_back_at: string | null
          rolled_back_by: string | null
          state: string
          status: string
          target_id: string | null
          target_type: string | null
        }
        SetofOptions: {
          from: "*"
          to: "command_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      command_action_set_after_snapshot: {
        Args: { _after: Json; _id: string }
        Returns: undefined
      }
      command_action_transition: {
        Args: { _id: string; _to: string }
        Returns: {
          admin_id: string | null
          after_snapshot: Json | null
          approved_at: string | null
          before_snapshot: Json | null
          created_at: string
          error: string | null
          executed_at: string | null
          id: string
          intent: string
          payload: Json | null
          preview: Json | null
          prompt: string | null
          result: Json | null
          risk_tier: string
          rolled_back_at: string | null
          rolled_back_by: string | null
          state: string
          status: string
          target_id: string | null
          target_type: string | null
        }
        SetofOptions: {
          from: "*"
          to: "command_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      delete_visitor_data: { Args: { _visitor_id: string }; Returns: Json }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      growth_overview: {
        Args: { _since?: string; _until?: string }
        Returns: Json
      }
      growth_records_by_source: {
        Args: {
          _category?: string
          _since: string
          _source?: string
          _until: string
        }
        Returns: {
          amount_gbp: number
          category: string
          converted_at: string
          email: string
          entity_id: string
          entity_type: string
          inquiry_id: string
          name: string
          order_id: string
          service: string
          source: string
          status: string
        }[]
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
      record_lead_attribution: { Args: { payload: Json }; Returns: string }
      reminder_inbox: {
        Args: { _limit?: number }
        Returns: {
          category: string
          due_date: string
          payload: Json
          severity: string
          source: string
          target_id: string
          target_type: string
          title: string
        }[]
      }
      resolve_service_price: { Args: { _title: string }; Returns: number }
      run_temporary_cleanup: {
        Args: { retention_days?: number }
        Returns: Json
      }
      scheduled_jobs_status: {
        Args: never
        Returns: {
          active: boolean
          duration_ms: number
          failures_24h: number
          jobname: string
          last_error: string
          last_run: string
          last_status: string
          run_count_24h: number
          schedule: string
        }[]
      }
      upsert_visitor_attribution: {
        Args: { payload: Json }
        Returns: undefined
      }
      upsert_visitor_declared_source: {
        Args: {
          _action?: string
          _category?: string
          _source: string
          _source_label?: string
          _visitor_id: string
        }
        Returns: Json
      }
      upsert_whatsapp_contact: {
        Args: {
          _country?: string
          _display_name?: string
          _phone_e164: string
          _source?: string
          _user_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "client"
      lead_stage:
        | "new"
        | "contacted"
        | "interested"
        | "followup"
        | "converted"
        | "closed"
        | "rejected"
      managed_company_status:
        | "available"
        | "reserved"
        | "sold_out"
        | "unavailable"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "done" | "cancelled"
      whatsapp_broadcast_status:
        | "draft"
        | "scheduled"
        | "running"
        | "completed"
        | "cancelled"
        | "failed"
      whatsapp_opt_in_status: "pending" | "opted_in" | "opted_out"
      whatsapp_template_category: "UTILITY" | "MARKETING" | "AUTHENTICATION"
      whatsapp_template_status:
        | "pending"
        | "approved"
        | "rejected"
        | "paused"
        | "disabled"
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
      lead_stage: [
        "new",
        "contacted",
        "interested",
        "followup",
        "converted",
        "closed",
        "rejected",
      ],
      managed_company_status: [
        "available",
        "reserved",
        "sold_out",
        "unavailable",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "done", "cancelled"],
      whatsapp_broadcast_status: [
        "draft",
        "scheduled",
        "running",
        "completed",
        "cancelled",
        "failed",
      ],
      whatsapp_opt_in_status: ["pending", "opted_in", "opted_out"],
      whatsapp_template_category: ["UTILITY", "MARKETING", "AUTHENTICATION"],
      whatsapp_template_status: [
        "pending",
        "approved",
        "rejected",
        "paused",
        "disabled",
      ],
    },
  },
} as const
