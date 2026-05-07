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
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
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
