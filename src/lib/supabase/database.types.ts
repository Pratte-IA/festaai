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
      agent_change_request_internal: {
        Row: {
          admin_notes: string | null
          request_id: number
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          request_id: number
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          request_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_change_request_internal_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "agent_change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_change_requests: {
        Row: {
          approved_at: string | null
          billing_status: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          desired_example: string | null
          estimated_price: number | null
          id: number
          impact_area: string | null
          request_type: string
          reviewed_at: string | null
          status: string
          tenant_id: number
          title: string
          updated_at: string
          urgency: string
        }
        Insert: {
          approved_at?: string | null
          billing_status?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          desired_example?: string | null
          estimated_price?: number | null
          id?: number
          impact_area?: string | null
          request_type: string
          reviewed_at?: string | null
          status?: string
          tenant_id: number
          title: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          approved_at?: string | null
          billing_status?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          desired_example?: string | null
          estimated_price?: number | null
          id?: number
          impact_area?: string | null
          request_type?: string
          reviewed_at?: string | null
          status?: string
          tenant_id?: number
          title?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_change_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_change_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_conversation_messages: {
        Row: {
          connection_id: number | null
          content: string
          created_at: string
          customer_phone: string
          id: number
          message_id: string | null
          metadata: Json
          role: string
          session_id: string
          tenant_id: number
        }
        Insert: {
          connection_id?: number | null
          content: string
          created_at?: string
          customer_phone: string
          id?: never
          message_id?: string | null
          metadata?: Json
          role: string
          session_id: string
          tenant_id: number
        }
        Update: {
          connection_id?: number | null
          content?: string
          created_at?: string
          customer_phone?: string
          id?: never
          message_id?: string | null
          metadata?: Json
          role?: string
          session_id?: string
          tenant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversation_messages_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_conversation_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_dispatch_logs: {
        Row: {
          connection_id: number | null
          created_at: string
          customer_phone: string | null
          direction: string
          error_message: string | null
          event: string
          id: number
          instance_name: string | null
          message_id: string | null
          n8n_response_status: number | null
          n8n_status: string
          payload: Json | null
          tenant_id: number | null
        }
        Insert: {
          connection_id?: number | null
          created_at?: string
          customer_phone?: string | null
          direction: string
          error_message?: string | null
          event: string
          id?: number
          instance_name?: string | null
          message_id?: string | null
          n8n_response_status?: number | null
          n8n_status?: string
          payload?: Json | null
          tenant_id?: number | null
        }
        Update: {
          connection_id?: number | null
          created_at?: string
          customer_phone?: string | null
          direction?: string
          error_message?: string | null
          event?: string
          id?: number
          instance_name?: string | null
          message_id?: string | null
          n8n_response_status?: number | null
          n8n_status?: string
          payload?: Json | null
          tenant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_dispatch_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_dispatch_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_contract_acceptances: {
        Row: {
          acceptance_declaration: string
          accepted_at: string
          accepted_by_company: string | null
          accepted_by_cpf_cnpj: string | null
          accepted_by_email: string
          accepted_by_name: string
          billing_subscription_id: number
          commercial_annex_snapshot: string
          commercial_snapshot: Json
          contract_body_snapshot: string
          contract_version: string
          created_at: string
          external_reference: string | null
          id: number
          ip_address: unknown
          metadata: Json
          user_agent: string | null
        }
        Insert: {
          acceptance_declaration: string
          accepted_at?: string
          accepted_by_company?: string | null
          accepted_by_cpf_cnpj?: string | null
          accepted_by_email: string
          accepted_by_name: string
          billing_subscription_id: number
          commercial_annex_snapshot: string
          commercial_snapshot?: Json
          contract_body_snapshot: string
          contract_version: string
          created_at?: string
          external_reference?: string | null
          id?: number
          ip_address?: unknown
          metadata?: Json
          user_agent?: string | null
        }
        Update: {
          acceptance_declaration?: string
          accepted_at?: string
          accepted_by_company?: string | null
          accepted_by_cpf_cnpj?: string | null
          accepted_by_email?: string
          accepted_by_name?: string
          billing_subscription_id?: number
          commercial_annex_snapshot?: string
          commercial_snapshot?: Json
          contract_body_snapshot?: string
          contract_version?: string
          created_at?: string
          external_reference?: string | null
          id?: number
          ip_address?: unknown
          metadata?: Json
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_contract_acceptances_billing_subscription_id_fkey"
            columns: ["billing_subscription_id"]
            isOneToOne: true
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_subscription_adjustments: {
        Row: {
          adjustment_index: string
          adjustment_rate: number
          asaas_updated: boolean
          billing_subscription_id: number
          created_at: string
          effective_at: string
          id: number
          metadata: Json
          new_monthly_price: number
          notified_at: string | null
          previous_monthly_price: number
          provider_subscription_id: string | null
        }
        Insert: {
          adjustment_index?: string
          adjustment_rate: number
          asaas_updated?: boolean
          billing_subscription_id: number
          created_at?: string
          effective_at?: string
          id?: number
          metadata?: Json
          new_monthly_price: number
          notified_at?: string | null
          previous_monthly_price: number
          provider_subscription_id?: string | null
        }
        Update: {
          adjustment_index?: string
          adjustment_rate?: number
          asaas_updated?: boolean
          billing_subscription_id?: number
          created_at?: string
          effective_at?: string
          id?: number
          metadata?: Json
          new_monthly_price?: number
          notified_at?: string | null
          previous_monthly_price?: number
          provider_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscription_adjustments_billing_subscription_id_fkey"
            columns: ["billing_subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_customers: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          id: number
          metadata: Json
          name: string
          phone: string | null
          provider: string
          provider_customer_id: string | null
          tenant_id: number | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          id?: number
          metadata?: Json
          name: string
          phone?: string | null
          provider?: string
          provider_customer_id?: string | null
          tenant_id?: number | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          id?: number
          metadata?: Json
          name?: string
          phone?: string | null
          provider?: string
          provider_customer_id?: string | null
          tenant_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_subscriptions: {
        Row: {
          canceled_at: string | null
          checkout_url: string | null
          created_at: string
          current_period_end: string | null
          customer_id: number | null
          external_reference: string
          id: number
          metadata: Json
          next_due_date: string | null
          plan_id: number | null
          provider: string
          provider_subscription_id: string | null
          status: string
          tenant_id: number | null
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          checkout_url?: string | null
          created_at?: string
          current_period_end?: string | null
          customer_id?: number | null
          external_reference: string
          id?: number
          metadata?: Json
          next_due_date?: string | null
          plan_id?: number | null
          provider?: string
          provider_subscription_id?: string | null
          status?: string
          tenant_id?: number | null
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          checkout_url?: string | null
          created_at?: string
          current_period_end?: string | null
          customer_id?: number | null
          external_reference?: string
          id?: number
          metadata?: Json
          next_due_date?: string | null
          plan_id?: number | null
          provider?: string
          provider_subscription_id?: string | null
          status?: string
          tenant_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_webhook_events: {
        Row: {
          created_at: string
          event_type: string
          external_event_id: string
          id: number
          payload: Json
          processed_at: string | null
          provider: string
        }
        Insert: {
          created_at?: string
          event_type: string
          external_event_id: string
          id?: number
          payload: Json
          processed_at?: string | null
          provider: string
        }
        Update: {
          created_at?: string
          event_type?: string
          external_event_id?: string
          id?: number
          payload?: Json
          processed_at?: string | null
          provider?: string
        }
        Relationships: []
      }
      calendar_blocks: {
        Row: {
          created_at: string
          created_by: string | null
          data: string
          id: number
          motivo: string | null
          tenant_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data: string
          id?: number
          motivo?: string | null
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: string
          id?: number
          motivo?: string | null
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_leads: {
        Row: {
          company_name: string
          created_at: string
          email: string
          id: number
          message: string
          name: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          email: string
          id?: number
          message?: string
          name: string
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          id?: number
          message?: string
          name?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      commercial_offers: {
        Row: {
          base_plan_slug: string
          billing_subscription_id: number | null
          created_at: string
          created_by: string | null
          expires_at: string
          id: number
          lead_id: number | null
          loyalty_months: number | null
          monthly_price: number
          name: string
          recipient_company: string | null
          recipient_email: string | null
          setup_installments: number | null
          setup_price: number
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          base_plan_slug: string
          billing_subscription_id?: number | null
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: number
          lead_id?: number | null
          loyalty_months?: number | null
          monthly_price: number
          name: string
          recipient_company?: string | null
          recipient_email?: string | null
          setup_installments?: number | null
          setup_price?: number
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          base_plan_slug?: string
          billing_subscription_id?: number | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: number
          lead_id?: number | null
          loyalty_months?: number | null
          monthly_price?: number
          name?: string
          recipient_company?: string | null
          recipient_email?: string | null
          setup_installments?: number | null
          setup_price?: number
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_offers_billing_subscription_id_fkey"
            columns: ["billing_subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_offers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "commercial_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          created_at: string
          error_message: string | null
          id: number
          metadata: Json
          payload: Json
          provider: string
          provider_message_id: string | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string
          subject: string
          template_key: string
          tenant_id: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: number
          metadata?: Json
          payload?: Json
          provider?: string
          provider_message_id?: string | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_key: string
          tenant_id?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: number
          metadata?: Json
          payload?: Json
          provider?: string
          provider_message_id?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_key?: string
          tenant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_lancamentos: {
        Row: {
          categoria: string
          created_at: string
          created_by: string | null
          data_competencia: string | null
          data_lancamento: string
          descricao: string | null
          evento_id: number | null
          id: number
          observacao: string | null
          origem: string
          referencia_id: number | null
          referencia_tipo: string | null
          tenant_id: number
          tipo: string
          updated_at: string
          updated_by: string | null
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          created_by?: string | null
          data_competencia?: string | null
          data_lancamento: string
          descricao?: string | null
          evento_id?: number | null
          id?: number
          observacao?: string | null
          origem: string
          referencia_id?: number | null
          referencia_tipo?: string | null
          tenant_id: number
          tipo: string
          updated_at?: string
          updated_by?: string | null
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string
          created_by?: string | null
          data_competencia?: string | null
          data_lancamento?: string
          descricao?: string | null
          evento_id?: number | null
          id?: number
          observacao?: string | null
          origem?: string
          referencia_id?: number | null
          referencia_tipo?: string | null
          tenant_id?: number
          tipo?: string
          updated_at?: string
          updated_by?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_lancamentos_evento_tenant_fkey"
            columns: ["evento_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "financeiro_lancamentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_acceptance_responses: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          created_at: string
          created_by: string | null
          evento_id: number
          id: number
          tenant_id: number
          term_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          evento_id: number
          id?: number
          tenant_id: number
          term_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          evento_id?: number
          id?: number
          tenant_id?: number
          term_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_acceptance_responses_evento_tenant_fkey"
            columns: ["evento_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "evento_acceptance_responses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_acceptance_responses_term_tenant_fkey"
            columns: ["term_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_acceptance_terms"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      evento_closing_responses: {
        Row: {
          created_at: string
          created_by: string | null
          evento_id: number
          field_id: number
          id: number
          tenant_id: number
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          evento_id: number
          field_id: number
          id?: number
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          evento_id?: number
          field_id?: number
          id?: number
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_closing_responses_evento_tenant_fkey"
            columns: ["evento_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "evento_closing_responses_field_tenant_fkey"
            columns: ["field_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_closing_form_fields"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "evento_closing_responses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_satisfaction_responses: {
        Row: {
          created_at: string
          created_by: string | null
          evento_id: number
          id: number
          question_id: number
          tenant_id: number
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          evento_id: number
          id?: number
          question_id: number
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          evento_id?: number
          id?: number
          question_id?: number
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_satisfaction_responses_evento_tenant_fkey"
            columns: ["evento_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "evento_satisfaction_responses_question_tenant_fkey"
            columns: ["question_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_satisfaction_survey_questions"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "evento_satisfaction_responses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_contract_acceptances: {
        Row: {
          acceptance_text: string
          accepted_at: string
          accepted_by_cpf: string | null
          accepted_by_email: string | null
          accepted_by_name: string
          accepted_by_phone: string | null
          accepted_terms_snapshot: Json
          contract_id: number
          created_at: string
          created_by: string | null
          evento_id: number
          id: number
          ip_address: unknown
          metadata: Json
          tenant_id: number
          user_agent: string | null
        }
        Insert: {
          acceptance_text: string
          accepted_at?: string
          accepted_by_cpf?: string | null
          accepted_by_email?: string | null
          accepted_by_name: string
          accepted_by_phone?: string | null
          accepted_terms_snapshot?: Json
          contract_id: number
          created_at?: string
          created_by?: string | null
          evento_id: number
          id?: number
          ip_address?: unknown
          metadata?: Json
          tenant_id: number
          user_agent?: string | null
        }
        Update: {
          acceptance_text?: string
          accepted_at?: string
          accepted_by_cpf?: string | null
          accepted_by_email?: string | null
          accepted_by_name?: string
          accepted_by_phone?: string | null
          accepted_terms_snapshot?: Json
          contract_id?: number
          created_at?: string
          created_by?: string | null
          evento_id?: number
          id?: number
          ip_address?: unknown
          metadata?: Json
          tenant_id?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_contract_acceptances_contract_tenant_fkey"
            columns: ["contract_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "evento_contracts"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "evento_contract_acceptances_evento_tenant_fkey"
            columns: ["evento_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "evento_contract_acceptances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_contracts: {
        Row: {
          accepted_at: string | null
          contract_hash: string
          contract_html: string
          contract_number: string
          contract_snapshot: Json
          contract_text: string | null
          created_at: string
          created_by: string | null
          evento_id: number
          generated_at: string
          id: number
          status: Database["public"]["Enums"]["evento_contract_status"]
          superseded_by: number | null
          template_id: number
          template_version: number
          tenant_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accepted_at?: string | null
          contract_hash: string
          contract_html: string
          contract_number: string
          contract_snapshot?: Json
          contract_text?: string | null
          created_at?: string
          created_by?: string | null
          evento_id: number
          generated_at?: string
          id?: number
          status?: Database["public"]["Enums"]["evento_contract_status"]
          superseded_by?: number | null
          template_id: number
          template_version?: number
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accepted_at?: string | null
          contract_hash?: string
          contract_html?: string
          contract_number?: string
          contract_snapshot?: Json
          contract_text?: string | null
          created_at?: string
          created_by?: string | null
          evento_id?: number
          generated_at?: string
          id?: number
          status?: Database["public"]["Enums"]["evento_contract_status"]
          superseded_by?: number | null
          template_id?: number
          template_version?: number
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_contracts_evento_tenant_fkey"
            columns: ["evento_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "evento_contracts_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "evento_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_contracts_template_tenant_fkey"
            columns: ["template_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_contract_templates"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "evento_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_notas: {
        Row: {
          created_at: string
          created_by: string | null
          evento_id: number
          id: number
          tenant_id: number
          texto: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          evento_id: number
          id?: number
          tenant_id: number
          texto: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          evento_id?: number
          id?: number
          tenant_id?: number
          texto?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_notas_evento_tenant_fkey"
            columns: ["evento_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "evento_notas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_pagamentos: {
        Row: {
          created_at: string
          created_by: string | null
          data_pagamento: string
          evento_id: number
          id: number
          metodo: string | null
          observacao: string | null
          tenant_id: number
          updated_at: string
          updated_by: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_pagamento: string
          evento_id: number
          id?: number
          metodo?: string | null
          observacao?: string | null
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
          valor: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_pagamento?: string
          evento_id?: number
          id?: number
          metodo?: string | null
          observacao?: string | null
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "evento_pagamentos_evento_tenant_fkey"
            columns: ["evento_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "evento_pagamentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_tarefas: {
        Row: {
          assigned_to: string | null
          concluida: boolean
          created_at: string
          created_by: string | null
          data_limite: string | null
          evento_id: number
          id: number
          ordem: number
          tenant_id: number
          titulo: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          concluida?: boolean
          created_at?: string
          created_by?: string | null
          data_limite?: string | null
          evento_id: number
          id?: number
          ordem?: number
          tenant_id: number
          titulo: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          concluida?: boolean
          created_at?: string
          created_by?: string | null
          data_limite?: string | null
          evento_id?: number
          id?: number
          ordem?: number
          tenant_id?: number
          titulo?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_tarefas_evento_tenant_fkey"
            columns: ["evento_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "evento_tarefas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          adicionais_snapshot: Json | null
          aniversariante_data_nascimento: string | null
          aniversariante_idade: number | null
          aniversariante_nome: string | null
          aniversariante_personagem: string | null
          aniversariante_tema: string | null
          boas_vindas_whatsapp_agendado_em: string | null
          boas_vindas_whatsapp_enviado_em: string | null
          checklist_concluidos: Json
          checklist_extras: Json
          cliente_bairro: string | null
          cliente_cep: string | null
          cliente_cidade: string | null
          cliente_cpf: string | null
          cliente_email: string | null
          cliente_estado: string | null
          cliente_nome: string
          cliente_numero: string | null
          cliente_rg: string | null
          cliente_rua: string | null
          cliente_telefone: string | null
          contato_inicial_ultima_mensagem_em: string | null
          convidados_alteracoes_historico: Json
          created_at: string
          created_by: string | null
          data_evento: string | null
          data_limite_pagamento: string | null
          data_primeiro_contato: string | null
          etapa: string
          executadas_transicao_em: string | null
          fechamento_confirmado_em: string | null
          fup1_enviado_em: string | null
          fup1_variante: string | null
          fup_resposta_cliente_em: string | null
          fof1_enviado_em: string | null
          fof2_enviado_em: string | null
          fof3_enviado_em: string | null
          fof_festa_alvo: string | null
          fof_resposta_cliente_em: string | null
          fof_status: string | null
          fop1_enviado_em: string | null
          fop2_enviado_em: string | null
          fop3_enviado_em: string | null
          fop_resposta_cliente_em: string | null
          followup_0_enviado_em: string | null
          followup_0b_enviado_em: string | null
          followup_1_enviado_em: string | null
          followup_1_variante: string | null
          followup_2_enviado_em: string | null
          followup_2_variante: string | null
          followup_3_enviado_em: string | null
          followup_3_variante: string | null
          followup_4_enviado_em: string | null
          followup_4_variante: string | null
          followup_cancelado_motivo: string | null
          followup_resposta_cliente_em: string | null
          followup_status: string | null
          forma_pagamento_entrada: string | null
          forma_pagamento_saldo: string | null
          funil: string
          hora_evento: string | null
          hora_termino: string | null
          id: number
          motivo_perda: string | null
          observacoes: string | null
          observacoes_festa: string | null
          origem: string | null
          pacote_convidados_inclusos: number | null
          pacote_id: number | null
          pacote_nome: string | null
          parcelas: number | null
          proposta_enviada_em: string | null
          quantidade_adultos: number | null
          quantidade_convidados: number | null
          quantidade_crianas: number | null
          reativacao_festa_alvo: string | null
          reativacao_status: string | null
          satisfaction_survey_followup_enviado_em: string | null
          satisfaction_survey_nps_baixa_enviado_em: string | null
          satisfaction_survey_preenchido_em: string | null
          satisfaction_survey_whatsapp_enviado_em: string | null
          sete_dias_whatsapp_enviado_em: string | null
          status_interno: string
          tenant_id: number
          tipo_evento: string
          updated_at: string
          updated_by: string | null
          valor_adicionais: number
          valor_entrada: number
          valor_pacote: number
          valor_saldo: number
          valor_total: number
        }
        Insert: {
          adicionais_snapshot?: Json | null
          aniversariante_data_nascimento?: string | null
          aniversariante_idade?: number | null
          aniversariante_nome?: string | null
          aniversariante_personagem?: string | null
          aniversariante_tema?: string | null
          boas_vindas_whatsapp_agendado_em?: string | null
          boas_vindas_whatsapp_enviado_em?: string | null
          checklist_concluidos?: Json
          checklist_extras?: Json
          cliente_bairro?: string | null
          cliente_cep?: string | null
          cliente_cidade?: string | null
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_estado?: string | null
          cliente_nome: string
          cliente_numero?: string | null
          cliente_rg?: string | null
          cliente_rua?: string | null
          cliente_telefone?: string | null
          contato_inicial_ultima_mensagem_em?: string | null
          convidados_alteracoes_historico?: Json
          created_at?: string
          created_by?: string | null
          data_evento?: string | null
          data_limite_pagamento?: string | null
          data_primeiro_contato?: string | null
          etapa?: string
          executadas_transicao_em?: string | null
          fechamento_confirmado_em?: string | null
          fof1_enviado_em?: string | null
          fof2_enviado_em?: string | null
          fof3_enviado_em?: string | null
          fof_festa_alvo?: string | null
          fof_resposta_cliente_em?: string | null
          fof_status?: string | null
          fop1_enviado_em?: string | null
          fop2_enviado_em?: string | null
          fop3_enviado_em?: string | null
          fop_resposta_cliente_em?: string | null
          fup1_enviado_em?: string | null
          fup1_variante?: string | null
          fup_resposta_cliente_em?: string | null
          followup_0_enviado_em?: string | null
          followup_0b_enviado_em?: string | null
          followup_1_enviado_em?: string | null
          followup_1_variante?: string | null
          followup_2_enviado_em?: string | null
          followup_2_variante?: string | null
          followup_3_enviado_em?: string | null
          followup_3_variante?: string | null
          followup_4_enviado_em?: string | null
          followup_4_variante?: string | null
          followup_cancelado_motivo?: string | null
          followup_resposta_cliente_em?: string | null
          followup_status?: string | null
          forma_pagamento_entrada?: string | null
          forma_pagamento_saldo?: string | null
          funil?: string
          hora_evento?: string | null
          hora_termino?: string | null
          id?: number
          motivo_perda?: string | null
          observacoes?: string | null
          observacoes_festa?: string | null
          origem?: string | null
          pacote_convidados_inclusos?: number | null
          pacote_id?: number | null
          pacote_nome?: string | null
          parcelas?: number | null
          proposta_enviada_em?: string | null
          quantidade_adultos?: number | null
          quantidade_convidados?: number | null
          quantidade_crianas?: number | null
          reativacao_festa_alvo?: string | null
          reativacao_status?: string | null
          satisfaction_survey_followup_enviado_em?: string | null
          satisfaction_survey_nps_baixa_enviado_em?: string | null
          satisfaction_survey_preenchido_em?: string | null
          satisfaction_survey_whatsapp_enviado_em?: string | null
          sete_dias_whatsapp_enviado_em?: string | null
          status_interno?: string
          tenant_id: number
          tipo_evento?: string
          updated_at?: string
          updated_by?: string | null
          valor_adicionais?: number
          valor_entrada?: number
          valor_pacote?: number
          valor_saldo?: number
          valor_total?: number
        }
        Update: {
          adicionais_snapshot?: Json | null
          aniversariante_data_nascimento?: string | null
          aniversariante_idade?: number | null
          aniversariante_nome?: string | null
          aniversariante_personagem?: string | null
          aniversariante_tema?: string | null
          boas_vindas_whatsapp_agendado_em?: string | null
          boas_vindas_whatsapp_enviado_em?: string | null
          checklist_concluidos?: Json
          checklist_extras?: Json
          cliente_bairro?: string | null
          cliente_cep?: string | null
          cliente_cidade?: string | null
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_estado?: string | null
          cliente_nome?: string
          cliente_numero?: string | null
          cliente_rg?: string | null
          cliente_rua?: string | null
          cliente_telefone?: string | null
          contato_inicial_ultima_mensagem_em?: string | null
          convidados_alteracoes_historico?: Json
          created_at?: string
          created_by?: string | null
          data_evento?: string | null
          data_limite_pagamento?: string | null
          data_primeiro_contato?: string | null
          etapa?: string
          executadas_transicao_em?: string | null
          fechamento_confirmado_em?: string | null
          fof1_enviado_em?: string | null
          fof2_enviado_em?: string | null
          fof3_enviado_em?: string | null
          fof_festa_alvo?: string | null
          fof_resposta_cliente_em?: string | null
          fof_status?: string | null
          fop1_enviado_em?: string | null
          fop2_enviado_em?: string | null
          fop3_enviado_em?: string | null
          fop_resposta_cliente_em?: string | null
          fup1_enviado_em?: string | null
          fup1_variante?: string | null
          fup_resposta_cliente_em?: string | null
          followup_0_enviado_em?: string | null
          followup_0b_enviado_em?: string | null
          followup_1_enviado_em?: string | null
          followup_1_variante?: string | null
          followup_2_enviado_em?: string | null
          followup_2_variante?: string | null
          followup_3_enviado_em?: string | null
          followup_3_variante?: string | null
          followup_4_enviado_em?: string | null
          followup_4_variante?: string | null
          followup_cancelado_motivo?: string | null
          followup_resposta_cliente_em?: string | null
          followup_status?: string | null
          forma_pagamento_entrada?: string | null
          forma_pagamento_saldo?: string | null
          funil?: string
          hora_evento?: string | null
          hora_termino?: string | null
          id?: number
          motivo_perda?: string | null
          observacoes?: string | null
          observacoes_festa?: string | null
          origem?: string | null
          pacote_convidados_inclusos?: number | null
          pacote_id?: number | null
          pacote_nome?: string | null
          parcelas?: number | null
          proposta_enviada_em?: string | null
          quantidade_adultos?: number | null
          quantidade_convidados?: number | null
          quantidade_crianas?: number | null
          reativacao_festa_alvo?: string | null
          reativacao_status?: string | null
          satisfaction_survey_followup_enviado_em?: string | null
          satisfaction_survey_nps_baixa_enviado_em?: string | null
          satisfaction_survey_preenchido_em?: string | null
          satisfaction_survey_whatsapp_enviado_em?: string | null
          sete_dias_whatsapp_enviado_em?: string | null
          status_interno?: string
          tenant_id?: number
          tipo_evento?: string
          updated_at?: string
          updated_by?: string | null
          valor_adicionais?: number
          valor_entrada?: number
          valor_pacote?: number
          valor_saldo?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "eventos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          created_at: string
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          created_at?: string
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      platform_whatsapp_conversations: {
        Row: {
          connection_id: number
          created_at: string
          customer_name: string | null
          customer_phone: string
          id: number
          last_message_at: string | null
          last_message_preview: string | null
          lost_reason: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          connection_id: number
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          id?: number
          last_message_at?: string | null
          last_message_preview?: string | null
          lost_reason?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          connection_id?: number
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          id?: number
          last_message_at?: string | null
          last_message_preview?: string | null
          lost_reason?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_whatsapp_conversations_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_platform_admin: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_platform_admin?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_platform_admin?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: number
          loyalty_months: number | null
          metadata: Json
          monthly_price: number
          name: string
          provider: string
          setup_installments: number | null
          setup_price: number
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: number
          loyalty_months?: number | null
          metadata?: Json
          monthly_price: number
          name: string
          provider?: string
          setup_installments?: number | null
          setup_price?: number
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: number
          loyalty_months?: number | null
          metadata?: Json
          monthly_price?: number
          name?: string
          provider?: string
          setup_installments?: number | null
          setup_price?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_error_report_files: {
        Row: {
          byte_size: number
          content_type: string | null
          created_at: string
          file_name: string
          id: number
          report_id: number
          sort_order: number
          storage_path: string
        }
        Insert: {
          byte_size: number
          content_type?: string | null
          created_at?: string
          file_name: string
          id?: number
          report_id: number
          sort_order?: number
          storage_path: string
        }
        Update: {
          byte_size?: number
          content_type?: string | null
          created_at?: string
          file_name?: string
          id?: number
          report_id?: number
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_error_report_files_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "support_error_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      support_error_reports: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: number
          tenant_id: number
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: number
          tenant_id: number
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: number
          tenant_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_error_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_error_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_acceptance_terms: {
        Row: {
          active: boolean
          appears_in_contract: boolean
          content: string
          created_at: string
          created_by: string | null
          id: number
          is_required: boolean
          is_system: boolean
          show_at_signing: boolean
          show_in_form: boolean
          sort_order: number
          tenant_id: number
          term_key: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          appears_in_contract?: boolean
          content: string
          created_at?: string
          created_by?: string | null
          id?: number
          is_required?: boolean
          is_system?: boolean
          show_at_signing?: boolean
          show_in_form?: boolean
          sort_order?: number
          tenant_id: number
          term_key?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          appears_in_contract?: boolean
          content?: string
          created_at?: string
          created_by?: string | null
          id?: number
          is_required?: boolean
          is_system?: boolean
          show_at_signing?: boolean
          show_in_form?: boolean
          sort_order?: number
          tenant_id?: number
          term_key?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_acceptance_terms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_additionals: {
        Row: {
          active: boolean
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: number
          is_required: boolean
          name: string
          package_ids: number[]
          price: number
          sort_order: number
          tenant_id: number
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_required?: boolean
          name: string
          package_ids?: number[]
          price?: number
          sort_order?: number
          tenant_id: number
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_required?: boolean
          name?: string
          package_ids?: number[]
          price?: number
          sort_order?: number
          tenant_id?: number
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_additionals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_automation_settings: {
        Row: {
          automation_template_bindings: Json
          created_at: string
          inbound_automation_enabled: boolean
          n8n_editor_url: string | null
          n8n_folder_id: string | null
          n8n_inbound_webhook_url: string | null
          n8n_last_error: string | null
          n8n_outbound_webhook_urls: Json
          n8n_provision_status: string
          n8n_provisioned_at: string | null
          n8n_routing_key: string | null
          n8n_workflow_id: string | null
          n8n_workflows: Json | null
          system_armed: boolean
          system_armed_at: string | null
          tenant_id: number
          updated_at: string
        }
        Insert: {
          automation_template_bindings?: Json
          created_at?: string
          inbound_automation_enabled?: boolean
          n8n_editor_url?: string | null
          n8n_folder_id?: string | null
          n8n_inbound_webhook_url?: string | null
          n8n_last_error?: string | null
          n8n_outbound_webhook_urls?: Json
          n8n_provision_status?: string
          n8n_provisioned_at?: string | null
          n8n_routing_key?: string | null
          n8n_workflow_id?: string | null
          n8n_workflows?: Json | null
          system_armed?: boolean
          system_armed_at?: string | null
          tenant_id: number
          updated_at?: string
        }
        Update: {
          automation_template_bindings?: Json
          created_at?: string
          inbound_automation_enabled?: boolean
          n8n_editor_url?: string | null
          n8n_folder_id?: string | null
          n8n_inbound_webhook_url?: string | null
          n8n_last_error?: string | null
          n8n_outbound_webhook_urls?: Json
          n8n_provision_status?: string
          n8n_provisioned_at?: string | null
          n8n_routing_key?: string | null
          n8n_workflow_id?: string | null
          n8n_workflows?: Json | null
          system_armed?: boolean
          system_armed_at?: string | null
          tenant_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_automation_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_checklist_categories: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: number
          name: string
          package_id: number
          sort_order: number
          tenant_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: number
          name: string
          package_id: number
          sort_order?: number
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: number
          name?: string
          package_id?: number
          sort_order?: number
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_checklist_categories_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "tenant_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_checklist_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_checklist_items: {
        Row: {
          active: boolean
          category_id: number
          created_at: string
          created_by: string | null
          id: number
          label: string
          sort_order: number
          tenant_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          category_id: number
          created_at?: string
          created_by?: string | null
          id?: number
          label: string
          sort_order?: number
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          category_id?: number
          created_at?: string
          created_by?: string | null
          id?: number
          label?: string
          sort_order?: number
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_checklist_items_category_tenant_fkey"
            columns: ["category_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_checklist_categories"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "tenant_checklist_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_closing_form_fields: {
        Row: {
          active: boolean
          category: string
          config: Json
          created_at: string
          created_by: string | null
          description: string | null
          field_key: string | null
          field_type: string
          id: number
          is_locked: boolean
          is_system: boolean
          label: string
          package_ids: number[]
          required: boolean
          section: string
          sort_order: number
          tenant_id: number
          updated_at: string
          updated_by: string | null
          usage_ai: boolean
          usage_checklist: boolean
          usage_contract: boolean
          usage_internal_task: boolean
          usage_party_summary: boolean
          usage_reports: boolean
        }
        Insert: {
          active?: boolean
          category?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          field_key?: string | null
          field_type?: string
          id?: number
          is_locked?: boolean
          is_system?: boolean
          label: string
          package_ids?: number[]
          required?: boolean
          section: string
          sort_order?: number
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
          usage_ai?: boolean
          usage_checklist?: boolean
          usage_contract?: boolean
          usage_internal_task?: boolean
          usage_party_summary?: boolean
          usage_reports?: boolean
        }
        Update: {
          active?: boolean
          category?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          field_key?: string | null
          field_type?: string
          id?: number
          is_locked?: boolean
          is_system?: boolean
          label?: string
          package_ids?: number[]
          required?: boolean
          section?: string
          sort_order?: number
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
          usage_ai?: boolean
          usage_checklist?: boolean
          usage_contract?: boolean
          usage_internal_task?: boolean
          usage_party_summary?: boolean
          usage_reports?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tenant_closing_form_fields_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_satisfaction_survey_questions: {
        Row: {
          active: boolean
          config: Json
          created_at: string
          created_by: string | null
          id: number
          is_system: boolean
          label: string
          question_key: string | null
          question_type: string
          required: boolean
          sort_order: number
          tenant_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: number
          is_system?: boolean
          label: string
          question_key?: string | null
          question_type?: string
          required?: boolean
          sort_order?: number
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: number
          is_system?: boolean
          label?: string
          question_key?: string | null
          question_type?: string
          required?: boolean
          sort_order?: number
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_satisfaction_survey_questions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_commercial_plans: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          fidelidade_meses: number | null
          id: number
          mensalidade_valor: number
          nome: string
          setup_parcelas: number | null
          setup_tipo: string
          setup_valor: number
          tenant_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          fidelidade_meses?: number | null
          id?: number
          mensalidade_valor?: number
          nome: string
          setup_parcelas?: number | null
          setup_tipo?: string
          setup_valor?: number
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          fidelidade_meses?: number | null
          id?: number
          mensalidade_valor?: number
          nome?: string
          setup_parcelas?: number | null
          setup_tipo?: string
          setup_valor?: number
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_commercial_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_company_profiles: {
        Row: {
          address_cep: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          cnpj: string | null
          company_name: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          legal_representative_cpf: string | null
          legal_representative_name: string | null
          tenant_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          cnpj?: string | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          legal_representative_cpf?: string | null
          legal_representative_name?: string | null
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          cnpj?: string | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          legal_representative_cpf?: string | null
          legal_representative_name?: string | null
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_company_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_contract_module_acceptances: {
        Row: {
          acceptance_text: string
          accepted_at: string
          accepted_by_cpf: string | null
          accepted_by_email: string | null
          accepted_by_name: string
          accepted_by_user_id: string
          created_at: string
          id: number
          tenant_id: number
          terms_version: number
          user_agent: string | null
        }
        Insert: {
          acceptance_text: string
          accepted_at?: string
          accepted_by_cpf?: string | null
          accepted_by_email?: string | null
          accepted_by_name: string
          accepted_by_user_id: string
          created_at?: string
          id?: number
          tenant_id: number
          terms_version: number
          user_agent?: string | null
        }
        Update: {
          acceptance_text?: string
          accepted_at?: string
          accepted_by_cpf?: string | null
          accepted_by_email?: string | null
          accepted_by_name?: string
          accepted_by_user_id?: string
          created_at?: string
          id?: number
          tenant_id?: number
          terms_version?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_contract_module_acceptances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_contract_module_settings: {
        Row: {
          default_template_key: string | null
          models_configured_at: string | null
          template_params: Json
          tenant_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          default_template_key?: string | null
          models_configured_at?: string | null
          template_params?: Json
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          default_template_key?: string | null
          models_configured_at?: string | null
          template_params?: Json
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_contract_module_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_contract_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: number
          is_active: boolean
          is_default: boolean
          name: string
          template_html: string
          template_key: string
          tenant_id: number
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          is_default?: boolean
          name: string
          template_html: string
          template_key: string
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          is_default?: boolean
          name?: string
          template_html?: string
          template_key?: string
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_contract_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_financial_settings: {
        Row: {
          cancellation_policy: string | null
          created_at: string
          created_by: string | null
          default_down_payment_fixed_value: number | null
          default_down_payment_percentage: number
          down_payment_method: string
          down_payment_mode: string
          installment_limit_mode: string
          max_balance_due_days: number | null
          max_deposit_due_days: number | null
          max_installments: number
          min_deposit_percentage: number | null
          remaining_card_installments: boolean
          remaining_due_before_event_enabled: boolean
          remaining_due_days_before_event: number
          remaining_pix_installments: boolean
          rescheduling_policy: string | null
          tenant_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cancellation_policy?: string | null
          created_at?: string
          created_by?: string | null
          default_down_payment_fixed_value?: number | null
          default_down_payment_percentage?: number
          down_payment_method?: string
          down_payment_mode?: string
          installment_limit_mode?: string
          max_balance_due_days?: number | null
          max_deposit_due_days?: number | null
          max_installments?: number
          min_deposit_percentage?: number | null
          remaining_card_installments?: boolean
          remaining_due_before_event_enabled?: boolean
          remaining_due_days_before_event?: number
          remaining_pix_installments?: boolean
          rescheduling_policy?: string | null
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cancellation_policy?: string | null
          created_at?: string
          created_by?: string | null
          default_down_payment_fixed_value?: number | null
          default_down_payment_percentage?: number
          down_payment_method?: string
          down_payment_mode?: string
          installment_limit_mode?: string
          max_balance_due_days?: number | null
          max_deposit_due_days?: number | null
          max_installments?: number
          min_deposit_percentage?: number | null
          remaining_card_installments?: boolean
          remaining_due_before_event_enabled?: boolean
          remaining_due_days_before_event?: number
          remaining_pix_installments?: boolean
          rescheduling_policy?: string | null
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_financial_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_guided_setup_progress: {
        Row: {
          completed_at: string | null
          completed_steps: string[]
          current_step: string
          tenant_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: string[]
          current_step?: string
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_steps?: string[]
          current_step?: string
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_guided_setup_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: number
          invited_by: string | null
          role: string
          status: string
          tenant_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          invited_by?: string | null
          role?: string
          status?: string
          tenant_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          invited_by?: string | null
          role?: string
          status?: string
          tenant_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_holidays: {
        Row: {
          active: boolean
          created_at: string
          holiday_date: string
          id: number
          kind: string
          name: string
          recurs_annually: boolean
          scope: string
          tenant_id: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          holiday_date: string
          id?: number
          kind: string
          name: string
          recurs_annually?: boolean
          scope: string
          tenant_id: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          holiday_date?: string
          id?: number
          kind?: string
          name?: string
          recurs_annually?: boolean
          scope?: string
          tenant_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_holidays_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_message_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: number
          key: string
          tenant_id: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: number
          key: string
          tenant_id: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: number
          key?: string
          tenant_id?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_message_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_packages: {
        Row: {
          active: boolean
          buffet: Json
          created_at: string
          created_by: string | null
          description: string
          duration_minutes: number | null
          equipe: Json
          estrutura: Json
          excluded_items: Json
          id: number
          included_guests: number | null
          included_items: Json
          name: string
          name_automacao: string
          pricing_tiers: Json
          rules: string | null
          sort_order: number
          tenant_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          buffet?: Json
          created_at?: string
          created_by?: string | null
          description?: string
          duration_minutes?: number | null
          equipe?: Json
          estrutura?: Json
          excluded_items?: Json
          id?: number
          included_guests?: number | null
          included_items?: Json
          name: string
          name_automacao: string
          pricing_tiers?: Json
          rules?: string | null
          sort_order?: number
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          buffet?: Json
          created_at?: string
          created_by?: string | null
          description?: string
          duration_minutes?: number | null
          equipe?: Json
          estrutura?: Json
          excluded_items?: Json
          id?: number
          included_guests?: number | null
          included_items?: Json
          name?: string
          name_automacao?: string
          pricing_tiers?: Json
          rules?: string | null
          sort_order?: number
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_packages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_payment_methods: {
        Row: {
          active: boolean
          allowed_for_deposit: boolean
          allowed_for_remaining_balance: boolean
          allows_installments: boolean
          created_at: string
          created_by: string | null
          fee_fixed: number | null
          fee_percentage: number | null
          id: number
          max_installments: number | null
          name: string
          notes: string | null
          payment_type: string
          sort_order: number
          tenant_id: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          allowed_for_deposit?: boolean
          allowed_for_remaining_balance?: boolean
          allows_installments?: boolean
          created_at?: string
          created_by?: string | null
          fee_fixed?: number | null
          fee_percentage?: number | null
          id?: number
          max_installments?: number | null
          name: string
          notes?: string | null
          payment_type: string
          sort_order?: number
          tenant_id: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          allowed_for_deposit?: boolean
          allowed_for_remaining_balance?: boolean
          allows_installments?: boolean
          created_at?: string
          created_by?: string | null
          fee_fixed?: number | null
          fee_percentage?: number | null
          id?: number
          max_installments?: number | null
          name?: string
          notes?: string | null
          payment_type?: string
          sort_order?: number
          tenant_id?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_payment_methods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          document: string | null
          email: string | null
          id: number
          name: string
          phone: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: number
          name: string
          phone?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: number
          name?: string
          phone?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_connection_webhook_secrets: {
        Row: {
          connection_id: number
          created_at: string
          instance_api_key: string | null
          instance_name: string
          updated_at: string
          webhook_token: string
        }
        Insert: {
          connection_id: number
          created_at?: string
          instance_api_key?: string | null
          instance_name: string
          updated_at?: string
          webhook_token: string
        }
        Update: {
          connection_id?: number
          created_at?: string
          instance_api_key?: string | null
          instance_name?: string
          updated_at?: string
          webhook_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connection_webhook_secrets_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connections: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          instance_name: string
          last_error: string | null
          last_seen_at: string | null
          name: string
          phone: string | null
          provider: string
          qr_code: string | null
          scope: string
          status: string
          tenant_id: number | null
          type: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          instance_name: string
          last_error?: string | null
          last_seen_at?: string | null
          name: string
          phone?: string | null
          provider?: string
          qr_code?: string | null
          scope?: string
          status?: string
          tenant_id?: number | null
          type?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          instance_name?: string
          last_error?: string | null
          last_seen_at?: string | null
          name?: string
          phone?: string | null
          provider?: string
          qr_code?: string | null
          scope?: string
          status?: string
          tenant_id?: number | null
          type?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_webhook_ingest_logs: {
        Row: {
          auth_status: string
          created_at: string
          error_message: string | null
          event: string | null
          id: number
          instance_name: string | null
          payload: Json | null
          processing_status: string
          source: string
          tenant_id: number | null
        }
        Insert: {
          auth_status: string
          created_at?: string
          error_message?: string | null
          event?: string | null
          id?: number
          instance_name?: string | null
          payload?: Json | null
          processing_status?: string
          source?: string
          tenant_id?: number | null
        }
        Update: {
          auth_status?: string
          created_at?: string
          error_message?: string | null
          event?: string | null
          id?: number
          instance_name?: string | null
          payload?: Json | null
          processing_status?: string
          source?: string
          tenant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_webhook_ingest_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_tenant_holidays: {
        Args: { p_dates: string[]; p_tenant_id: number }
        Returns: {
          date: string
          holiday_kind: string | null
          holiday_name: string | null
          holiday_scope: string | null
          holiday_source: string | null
          is_holiday: boolean
        }[]
      }
      get_public_commercial_offer: {
        Args: { p_token: string }
        Returns: {
          base_plan_slug: string
          expires_at: string
          id: number
          loyalty_months: number
          monthly_price: number
          name: string
          recipient_company: string
          recipient_email: string
          setup_installments: number
          setup_price: number
          token: string
        }[]
      }
      has_tenant_role: {
        Args: { allowed_roles: string[]; target_tenant_id: number }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      is_tenant_member: { Args: { target_tenant_id: number }; Returns: boolean }
      list_tenant_holiday_calendar: {
        Args: { p_tenant_id: number; p_year: number }
        Returns: {
          active: boolean
          date: string
          editable: boolean
          id: number | null
          kind: string
          name: string
          recurrence_type: string
          recurs_annually: boolean
          scope: string
          source: string
        }[]
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      purge_agent_chat_memory: {
        Args: { retention_days?: number }
        Returns: Json
      }
      radar_crm_add_interaction: {
        Args: {
          p_clear_next_action?: boolean
          p_company_id: number
          p_interaction_at?: string
          p_interaction_type: string
          p_next_action_at?: string
          p_next_action_description?: string
          p_notes?: string
          p_outcome?: string
          p_priority?: string
          p_status?: string
        }
        Returns: Json
      }
      radar_crm_filter_options: { Args: never; Returns: Json }
      radar_crm_get_company: { Args: { p_company_id: number }; Returns: Json }
      radar_crm_kanban_board: {
        Args: {
          p_assigned_user_id?: string
          p_category?: string
          p_city?: string
          p_do_not_contact?: boolean
          p_entered_from?: string
          p_entered_to?: string
          p_has_administrator?: boolean
          p_has_instagram?: boolean
          p_has_phone?: boolean
          p_has_whatsapp?: boolean
          p_next_action_today?: boolean
          p_next_action_week?: boolean
          p_overdue_next_action?: boolean
          p_priorities?: string[]
          p_search?: string
          p_state?: string
          p_without_contact?: boolean
          p_without_next_action?: boolean
        }
        Returns: Json
      }
      radar_crm_list_companies: {
        Args: {
          p_assigned_user_id?: string
          p_category?: string
          p_city?: string
          p_cnpj_validated?: boolean
          p_has_administrator?: boolean
          p_has_instagram?: boolean
          p_has_phone?: boolean
          p_has_website?: boolean
          p_has_whatsapp?: boolean
          p_next_action_from?: string
          p_next_action_to?: string
          p_overdue_next_action?: boolean
          p_page?: number
          p_page_size?: number
          p_priorities?: string[]
          p_registration_active?: boolean
          p_search?: string
          p_state?: string
          p_statuses?: string[]
          p_without_contact?: boolean
        }
        Returns: Json
      }
      radar_crm_upsert_company: {
        Args: {
          p_assigned_user_id?: string
          p_clear_assigned_user?: boolean
          p_clear_next_action?: boolean
          p_company_id: number
          p_do_not_contact?: boolean
          p_last_contact_at?: string
          p_lost_reason?: string
          p_next_action_at?: string
          p_next_action_description?: string
          p_notes?: string
          p_priority?: string
          p_status?: string
        }
        Returns: Json
      }
    }
    Enums: {
      evento_contract_status:
        | "draft"
        | "generated"
        | "accepted"
        | "cancelled"
        | "superseded"
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
      evento_contract_status: [
        "draft",
        "generated",
        "accepted",
        "cancelled",
        "superseded",
      ],
    },
  },
} as const
