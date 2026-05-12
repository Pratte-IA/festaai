export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      billing_customers: {
        Row: {
          company_name: string | null;
          created_at: string;
          email: string;
          id: number;
          metadata: Json;
          name: string;
          phone: string | null;
          provider: string;
          provider_customer_id: string | null;
          tenant_id: number | null;
          updated_at: string;
        };
        Insert: {
          company_name?: string | null;
          created_at?: string;
          email: string;
          id?: number;
          metadata?: Json;
          name: string;
          phone?: string | null;
          provider?: string;
          provider_customer_id?: string | null;
          tenant_id?: number | null;
          updated_at?: string;
        };
        Update: {
          company_name?: string | null;
          created_at?: string;
          email?: string;
          id?: number;
          metadata?: Json;
          name?: string;
          phone?: string | null;
          provider?: string;
          provider_customer_id?: string | null;
          tenant_id?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_customers_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      billing_subscriptions: {
        Row: {
          canceled_at: string | null;
          checkout_url: string | null;
          created_at: string;
          current_period_end: string | null;
          customer_id: number | null;
          external_reference: string;
          id: number;
          metadata: Json;
          next_due_date: string | null;
          plan_id: number | null;
          provider: string;
          provider_subscription_id: string | null;
          status: string;
          tenant_id: number | null;
          updated_at: string;
        };
        Insert: {
          canceled_at?: string | null;
          checkout_url?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          customer_id?: number | null;
          external_reference: string;
          id?: number;
          metadata?: Json;
          next_due_date?: string | null;
          plan_id?: number | null;
          provider?: string;
          provider_subscription_id?: string | null;
          status?: string;
          tenant_id?: number | null;
          updated_at?: string;
        };
        Update: {
          canceled_at?: string | null;
          checkout_url?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          customer_id?: number | null;
          external_reference?: string;
          id?: number;
          metadata?: Json;
          next_due_date?: string | null;
          plan_id?: number | null;
          provider?: string;
          provider_subscription_id?: string | null;
          status?: string;
          tenant_id?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "billing_customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_subscriptions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      billing_webhook_events: {
        Row: {
          created_at: string;
          event_type: string;
          external_event_id: string;
          id: number;
          payload: Json;
          processed_at: string | null;
          provider: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          external_event_id: string;
          id?: number;
          payload: Json;
          processed_at?: string | null;
          provider: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          external_event_id?: string;
          id?: number;
          payload?: Json;
          processed_at?: string | null;
          provider?: string;
        };
        Relationships: [];
      };
      agent_change_request_internal: {
        Row: {
          admin_notes: string | null;
          request_id: number;
          updated_at: string;
        };
        Insert: {
          admin_notes?: string | null;
          request_id: number;
          updated_at?: string;
        };
        Update: {
          admin_notes?: string | null;
          request_id?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_change_request_internal_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: true;
            referencedRelation: "agent_change_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_change_requests: {
        Row: {
          approved_at: string | null;
          billing_status: string;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string;
          desired_example: string | null;
          estimated_price: number | null;
          id: number;
          impact_area: string | null;
          request_type: string;
          reviewed_at: string | null;
          status: string;
          tenant_id: number;
          title: string;
          updated_at: string;
          urgency: string;
        };
        Insert: {
          approved_at?: string | null;
          billing_status?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description: string;
          desired_example?: string | null;
          estimated_price?: number | null;
          id?: number;
          impact_area?: string | null;
          request_type: string;
          reviewed_at?: string | null;
          status?: string;
          tenant_id: number;
          title: string;
          updated_at?: string;
          urgency?: string;
        };
        Update: {
          approved_at?: string | null;
          billing_status?: string;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          desired_example?: string | null;
          estimated_price?: number | null;
          id?: number;
          impact_area?: string | null;
          request_type?: string;
          reviewed_at?: string | null;
          status?: string;
          tenant_id?: number;
          title?: string;
          updated_at?: string;
          urgency?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_change_requests_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_change_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_blocks: {
        Row: {
          created_at: string;
          created_by: string | null;
          data: string;
          id: number;
          motivo: string | null;
          tenant_id: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          data: string;
          id?: number;
          motivo?: string | null;
          tenant_id: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          data?: string;
          id?: number;
          motivo?: string | null;
          tenant_id?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_blocks_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      email_events: {
        Row: {
          created_at: string;
          error_message: string | null;
          id: number;
          metadata: Json;
          payload: Json;
          provider: string;
          provider_message_id: string | null;
          recipient_email: string;
          recipient_name: string | null;
          sent_at: string | null;
          status: string;
          subject: string;
          template_key: string;
          tenant_id: number | null;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          id?: number;
          metadata?: Json;
          payload?: Json;
          provider?: string;
          provider_message_id?: string | null;
          recipient_email: string;
          recipient_name?: string | null;
          sent_at?: string | null;
          status?: string;
          subject: string;
          template_key: string;
          tenant_id?: number | null;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          id?: number;
          metadata?: Json;
          payload?: Json;
          provider?: string;
          provider_message_id?: string | null;
          recipient_email?: string;
          recipient_name?: string | null;
          sent_at?: string | null;
          status?: string;
          subject?: string;
          template_key?: string;
          tenant_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "email_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      evento_notas: {
        Row: {
          created_at: string;
          created_by: string | null;
          evento_id: number;
          id: number;
          tenant_id: number;
          texto: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          evento_id: number;
          id?: number;
          tenant_id: number;
          texto: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          evento_id?: number;
          id?: number;
          tenant_id?: number;
          texto?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "evento_notas_evento_tenant_fkey";
            columns: ["evento_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "eventos";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "evento_notas_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      evento_pagamentos: {
        Row: {
          created_at: string;
          created_by: string | null;
          data_pagamento: string;
          evento_id: number;
          id: number;
          metodo: string | null;
          observacao: string | null;
          tenant_id: number;
          updated_at: string;
          updated_by: string | null;
          valor: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          data_pagamento: string;
          evento_id: number;
          id?: number;
          metodo?: string | null;
          observacao?: string | null;
          tenant_id: number;
          updated_at?: string;
          updated_by?: string | null;
          valor: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          data_pagamento?: string;
          evento_id?: number;
          id?: number;
          metodo?: string | null;
          observacao?: string | null;
          tenant_id?: number;
          updated_at?: string;
          updated_by?: string | null;
          valor?: number;
        };
        Relationships: [
          {
            foreignKeyName: "evento_pagamentos_evento_tenant_fkey";
            columns: ["evento_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "eventos";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "evento_pagamentos_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      evento_tarefas: {
        Row: {
          concluida: boolean;
          created_at: string;
          created_by: string | null;
          data_limite: string | null;
          evento_id: number;
          id: number;
          ordem: number;
          tenant_id: number;
          titulo: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          concluida?: boolean;
          created_at?: string;
          created_by?: string | null;
          data_limite?: string | null;
          evento_id: number;
          id?: number;
          ordem?: number;
          tenant_id: number;
          titulo: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          concluida?: boolean;
          created_at?: string;
          created_by?: string | null;
          data_limite?: string | null;
          evento_id?: number;
          id?: number;
          ordem?: number;
          tenant_id?: number;
          titulo?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "evento_tarefas_evento_tenant_fkey";
            columns: ["evento_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "eventos";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "evento_tarefas_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      eventos: {
        Row: {
          aniversariante_data_nascimento: string | null;
          aniversariante_nome: string | null;
          cliente_email: string | null;
          cliente_nome: string;
          cliente_telefone: string | null;
          created_at: string;
          created_by: string | null;
          data_evento: string | null;
          etapa: string;
          funil: string;
          hora_evento: string | null;
          id: number;
          motivo_perda: string | null;
          observacoes: string | null;
          origem: string | null;
          pacote_id: number | null;
          pacote_nome: string | null;
          quantidade_convidados: number | null;
          status_interno: string;
          tenant_id: number;
          tipo_evento: string;
          updated_at: string;
          updated_by: string | null;
          valor_adicionais: number;
          valor_entrada: number;
          valor_pacote: number;
          valor_total: number;
        };
        Insert: {
          aniversariante_data_nascimento?: string | null;
          aniversariante_nome?: string | null;
          cliente_email?: string | null;
          cliente_nome: string;
          cliente_telefone?: string | null;
          created_at?: string;
          created_by?: string | null;
          data_evento?: string | null;
          etapa?: string;
          funil?: string;
          hora_evento?: string | null;
          id?: number;
          motivo_perda?: string | null;
          observacoes?: string | null;
          origem?: string | null;
          pacote_id?: number | null;
          pacote_nome?: string | null;
          quantidade_convidados?: number | null;
          status_interno?: string;
          tenant_id: number;
          tipo_evento?: string;
          updated_at?: string;
          updated_by?: string | null;
          valor_adicionais?: number;
          valor_entrada?: number;
          valor_pacote?: number;
          valor_total?: number;
        };
        Update: {
          aniversariante_data_nascimento?: string | null;
          aniversariante_nome?: string | null;
          cliente_email?: string | null;
          cliente_nome?: string;
          cliente_telefone?: string | null;
          created_at?: string;
          created_by?: string | null;
          data_evento?: string | null;
          etapa?: string;
          funil?: string;
          hora_evento?: string | null;
          id?: number;
          motivo_perda?: string | null;
          observacoes?: string | null;
          origem?: string | null;
          pacote_id?: number | null;
          pacote_nome?: string | null;
          quantidade_convidados?: number | null;
          status_interno?: string;
          tenant_id?: number;
          tipo_evento?: string;
          updated_at?: string;
          updated_by?: string | null;
          valor_adicionais?: number;
          valor_entrada?: number;
          valor_pacote?: number;
          valor_total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "eventos_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          cpf: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          is_platform_admin: boolean;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          cpf?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          is_platform_admin?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          cpf?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          is_platform_admin?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          active: boolean;
          created_at: string;
          description: string;
          id: number;
          loyalty_months: number | null;
          metadata: Json;
          monthly_price: number;
          name: string;
          provider: string;
          setup_installments: number | null;
          setup_price: number;
          slug: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string;
          id?: number;
          loyalty_months?: number | null;
          metadata?: Json;
          monthly_price: number;
          name: string;
          provider?: string;
          setup_installments?: number | null;
          setup_price?: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string;
          id?: number;
          loyalty_months?: number | null;
          metadata?: Json;
          monthly_price?: number;
          name?: string;
          provider?: string;
          setup_installments?: number | null;
          setup_price?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      support_error_report_files: {
        Row: {
          byte_size: number;
          content_type: string | null;
          created_at: string;
          file_name: string;
          id: number;
          report_id: number;
          sort_order: number;
          storage_path: string;
        };
        Insert: {
          byte_size: number;
          content_type?: string | null;
          created_at?: string;
          file_name: string;
          id?: number;
          report_id: number;
          sort_order?: number;
          storage_path: string;
        };
        Update: {
          byte_size?: number;
          content_type?: string | null;
          created_at?: string;
          file_name?: string;
          id?: number;
          report_id?: number;
          sort_order?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_error_report_files_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "support_error_reports";
            referencedColumns: ["id"];
          },
        ];
      };
      support_error_reports: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string;
          id: number;
          tenant_id: number;
          title: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description: string;
          id?: number;
          tenant_id: number;
          title: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string;
          id?: number;
          tenant_id?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_error_reports_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "support_error_reports_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_additionals: {
        Row: {
          active: boolean;
          category: string;
          created_at: string;
          created_by: string | null;
          id: number;
          name: string;
          price: number;
          tenant_id: number;
          type: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          active?: boolean;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          id?: number;
          name: string;
          price?: number;
          tenant_id: number;
          type?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          active?: boolean;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          id?: number;
          name?: string;
          price?: number;
          tenant_id?: number;
          type?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_additionals_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_checklist_categories: {
        Row: {
          active: boolean;
          created_at: string;
          created_by: string | null;
          id: number;
          name: string;
          sort_order: number;
          tenant_id: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          created_by?: string | null;
          id?: number;
          name: string;
          sort_order?: number;
          tenant_id: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          created_by?: string | null;
          id?: number;
          name?: string;
          sort_order?: number;
          tenant_id?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_checklist_categories_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_checklist_items: {
        Row: {
          active: boolean;
          category_id: number;
          created_at: string;
          created_by: string | null;
          id: number;
          label: string;
          sort_order: number;
          tenant_id: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          active?: boolean;
          category_id: number;
          created_at?: string;
          created_by?: string | null;
          id?: number;
          label: string;
          sort_order?: number;
          tenant_id: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          active?: boolean;
          category_id?: number;
          created_at?: string;
          created_by?: string | null;
          id?: number;
          label?: string;
          sort_order?: number;
          tenant_id?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_checklist_items_category_tenant_fkey";
            columns: ["category_id", "tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenant_checklist_categories";
            referencedColumns: ["id", "tenant_id"];
          },
          {
            foreignKeyName: "tenant_checklist_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_commercial_plans: {
        Row: {
          ativo: boolean;
          created_at: string;
          created_by: string | null;
          fidelidade_meses: number | null;
          id: number;
          mensalidade_valor: number;
          nome: string;
          setup_parcelas: number | null;
          setup_tipo: string;
          setup_valor: number;
          tenant_id: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          ativo?: boolean;
          created_at?: string;
          created_by?: string | null;
          fidelidade_meses?: number | null;
          id?: number;
          mensalidade_valor?: number;
          nome: string;
          setup_parcelas?: number | null;
          setup_tipo?: string;
          setup_valor?: number;
          tenant_id: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          ativo?: boolean;
          created_at?: string;
          created_by?: string | null;
          fidelidade_meses?: number | null;
          id?: number;
          mensalidade_valor?: number;
          nome?: string;
          setup_parcelas?: number | null;
          setup_tipo?: string;
          setup_valor?: number;
          tenant_id?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_commercial_plans_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_estrutura_settings: {
        Row: {
          created_at: string;
          created_by: string | null;
          estrutura: Json;
          tenant_id: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          estrutura?: Json;
          tenant_id: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          estrutura?: Json;
          tenant_id?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_estrutura_settings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_financial_settings: {
        Row: {
          created_at: string;
          created_by: string | null;
          default_down_payment_percentage: number;
          max_installments: number;
          tenant_id: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          default_down_payment_percentage?: number;
          max_installments?: number;
          tenant_id: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          default_down_payment_percentage?: number;
          max_installments?: number;
          tenant_id?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_financial_settings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: true;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_members: {
        Row: {
          created_at: string;
          id: number;
          invited_by: string | null;
          role: string;
          status: string;
          tenant_id: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          invited_by?: string | null;
          role?: string;
          status?: string;
          tenant_id: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          invited_by?: string | null;
          role?: string;
          status?: string;
          tenant_id?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_message_templates: {
        Row: {
          body: string;
          created_at: string;
          created_by: string | null;
          id: number;
          key: string;
          tenant_id: number;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          id?: number;
          key: string;
          tenant_id: number;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          id?: number;
          key?: string;
          tenant_id?: number;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_message_templates_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_packages: {
        Row: {
          active: boolean;
          buffet: Json;
          created_at: string;
          created_by: string | null;
          description: string;
          equipe: Json;
          estrutura: Json;
          id: number;
          name: string;
          pricing_tiers: Json;
          tenant_id: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          active?: boolean;
          buffet?: Json;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          equipe?: Json;
          estrutura?: Json;
          id?: number;
          name: string;
          pricing_tiers?: Json;
          tenant_id: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          active?: boolean;
          buffet?: Json;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          equipe?: Json;
          estrutura?: Json;
          id?: number;
          name?: string;
          pricing_tiers?: Json;
          tenant_id?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_packages_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          created_at: string;
          document: string | null;
          email: string | null;
          id: number;
          name: string;
          phone: string | null;
          slug: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          document?: string | null;
          email?: string | null;
          id?: number;
          name: string;
          phone?: string | null;
          slug: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          document?: string | null;
          email?: string | null;
          id?: number;
          name?: string;
          phone?: string | null;
          slug?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_tenant_role: {
        Args: { allowed_roles: string[]; target_tenant_id: number };
        Returns: boolean;
      };
      is_platform_admin: {
        Args: never;
        Returns: boolean;
      };
      is_tenant_member: {
        Args: { target_tenant_id: number };
        Returns: boolean;
      };
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string };
        Returns: {
          content: string;
          id: number;
          metadata: Json;
          similarity: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
