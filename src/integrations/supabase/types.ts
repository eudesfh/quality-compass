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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          type: Database["public"]["Enums"]["company_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          type?: Database["public"]["Enums"]["company_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: Database["public"]["Enums"]["company_type"]
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      permission_profiles: {
        Row: {
          can_approve_rnc: boolean
          can_create_rnc: boolean
          can_manage_risks: boolean
          can_manage_settings: boolean
          can_manage_users: boolean
          can_validate: boolean
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          can_approve_rnc?: boolean
          can_create_rnc?: boolean
          can_manage_risks?: boolean
          can_manage_settings?: boolean
          can_manage_users?: boolean
          can_validate?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          can_approve_rnc?: boolean
          can_create_rnc?: boolean
          can_manage_risks?: boolean
          can_manage_settings?: boolean
          can_manage_users?: boolean
          can_validate?: boolean
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          permission_profile_id: string | null
          sector_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          permission_profile_id?: string | null
          sector_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          permission_profile_id?: string | null
          sector_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profiles_permission"
            columns: ["permission_profile_id"]
            isOneToOne: false
            referencedRelation: "permission_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profiles_sector"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_efficacy: {
        Row: {
          created_at: string
          evaluated_by: string | null
          evaluation_date: string | null
          evidence: string | null
          id: string
          is_effective: boolean | null
          risk_id: string
        }
        Insert: {
          created_at?: string
          evaluated_by?: string | null
          evaluation_date?: string | null
          evidence?: string | null
          id?: string
          is_effective?: boolean | null
          risk_id: string
        }
        Update: {
          created_at?: string
          evaluated_by?: string | null
          evaluation_date?: string | null
          evidence?: string | null
          id?: string
          is_effective?: boolean | null
          risk_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_efficacy_risk_id_fkey"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "risks"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          cause: string
          cause_source: string | null
          code: string
          company_id: string | null
          consequence: string | null
          created_at: string
          created_by: string
          deadline: string | null
          frequency: Database["public"]["Enums"]["risk_frequency"] | null
          id: string
          probability: number
          response: Database["public"]["Enums"]["risk_response"]
          risk_description: string
          risk_level: number | null
          sector_id: string | null
          severity: number
          status: Database["public"]["Enums"]["risk_status"]
          treatment: string | null
          updated_at: string
        }
        Insert: {
          cause: string
          cause_source?: string | null
          code: string
          company_id?: string | null
          consequence?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          frequency?: Database["public"]["Enums"]["risk_frequency"] | null
          id?: string
          probability: number
          response: Database["public"]["Enums"]["risk_response"]
          risk_description: string
          risk_level?: number | null
          sector_id?: string | null
          severity: number
          status?: Database["public"]["Enums"]["risk_status"]
          treatment?: string | null
          updated_at?: string
        }
        Update: {
          cause?: string
          cause_source?: string | null
          code?: string
          company_id?: string | null
          consequence?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          frequency?: Database["public"]["Enums"]["risk_frequency"] | null
          id?: string
          probability?: number
          response?: Database["public"]["Enums"]["risk_response"]
          risk_description?: string
          risk_level?: number | null
          sector_id?: string | null
          severity?: number
          status?: Database["public"]["Enums"]["risk_status"]
          treatment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      rnc_actions: {
        Row: {
          cost: number | null
          created_at: string
          deadline: string
          evidence: string | null
          evidence_file_path: string | null
          how_to_do: string
          id: string
          implemented_at: string | null
          is_implemented: boolean
          related_cause_why: number | null
          responsible_user_id: string
          rnc_id: string
          updated_at: string
          what_to_do: string
          why_to_do: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          deadline: string
          evidence?: string | null
          evidence_file_path?: string | null
          how_to_do: string
          id?: string
          implemented_at?: string | null
          is_implemented?: boolean
          related_cause_why?: number | null
          responsible_user_id: string
          rnc_id: string
          updated_at?: string
          what_to_do: string
          why_to_do: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          deadline?: string
          evidence?: string | null
          evidence_file_path?: string | null
          how_to_do?: string
          id?: string
          implemented_at?: string | null
          is_implemented?: boolean
          related_cause_why?: number | null
          responsible_user_id?: string
          rnc_id?: string
          updated_at?: string
          what_to_do?: string
          why_to_do?: string
        }
        Relationships: [
          {
            foreignKeyName: "rnc_actions_rnc_id_fkey"
            columns: ["rnc_id"]
            isOneToOne: false
            referencedRelation: "rnc_occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      rnc_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          rnc_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          rnc_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          rnc_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "rnc_attachments_rnc_id_fkey"
            columns: ["rnc_id"]
            isOneToOne: false
            referencedRelation: "rnc_occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      rnc_cause_analysis: {
        Row: {
          analyzed_by: string | null
          created_at: string
          id: string
          rnc_id: string
          root_cause_description: string | null
          root_cause_why: number | null
          updated_at: string
          why_1: string | null
          why_2: string | null
          why_3: string | null
          why_4: string | null
          why_5: string | null
        }
        Insert: {
          analyzed_by?: string | null
          created_at?: string
          id?: string
          rnc_id: string
          root_cause_description?: string | null
          root_cause_why?: number | null
          updated_at?: string
          why_1?: string | null
          why_2?: string | null
          why_3?: string | null
          why_4?: string | null
          why_5?: string | null
        }
        Update: {
          analyzed_by?: string | null
          created_at?: string
          id?: string
          rnc_id?: string
          root_cause_description?: string | null
          root_cause_why?: number | null
          updated_at?: string
          why_1?: string | null
          why_2?: string | null
          why_3?: string | null
          why_4?: string | null
          why_5?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rnc_cause_analysis_rnc_id_fkey"
            columns: ["rnc_id"]
            isOneToOne: false
            referencedRelation: "rnc_occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      rnc_efficacy: {
        Row: {
          created_at: string
          evaluated_by: string | null
          evaluation_date: string | null
          evidence: string | null
          evidence_file_path: string | null
          id: string
          is_effective: boolean | null
          rnc_id: string
          scheduled_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          evaluated_by?: string | null
          evaluation_date?: string | null
          evidence?: string | null
          evidence_file_path?: string | null
          id?: string
          is_effective?: boolean | null
          rnc_id: string
          scheduled_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          evaluated_by?: string | null
          evaluation_date?: string | null
          evidence?: string | null
          evidence_file_path?: string | null
          id?: string
          is_effective?: boolean | null
          rnc_id?: string
          scheduled_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rnc_efficacy_rnc_id_fkey"
            columns: ["rnc_id"]
            isOneToOne: false
            referencedRelation: "rnc_occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      rnc_occurrences: {
        Row: {
          approver_id: string
          code: string
          company_id: string
          company_type: Database["public"]["Enums"]["company_type"]
          created_at: string
          created_by: string
          criticality: Database["public"]["Enums"]["criticality_level"]
          description: string | null
          id: string
          notify_participants: boolean
          occurrence_date: string
          occurrence_type: Database["public"]["Enums"]["occurrence_type"]
          origin: string
          reclassified_type:
            | Database["public"]["Enums"]["occurrence_type"]
            | null
          rejection_reason: string | null
          sector_id: string
          status: Database["public"]["Enums"]["rnc_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          approver_id: string
          code: string
          company_id: string
          company_type: Database["public"]["Enums"]["company_type"]
          created_at?: string
          created_by: string
          criticality: Database["public"]["Enums"]["criticality_level"]
          description?: string | null
          id?: string
          notify_participants?: boolean
          occurrence_date: string
          occurrence_type: Database["public"]["Enums"]["occurrence_type"]
          origin: string
          reclassified_type?:
            | Database["public"]["Enums"]["occurrence_type"]
            | null
          rejection_reason?: string | null
          sector_id: string
          status?: Database["public"]["Enums"]["rnc_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          approver_id?: string
          code?: string
          company_id?: string
          company_type?: Database["public"]["Enums"]["company_type"]
          created_at?: string
          created_by?: string
          criticality?: Database["public"]["Enums"]["criticality_level"]
          description?: string | null
          id?: string
          notify_participants?: boolean
          occurrence_date?: string
          occurrence_type?: Database["public"]["Enums"]["occurrence_type"]
          origin?: string
          reclassified_type?:
            | Database["public"]["Enums"]["occurrence_type"]
            | null
          rejection_reason?: string | null
          sector_id?: string
          status?: Database["public"]["Enums"]["rnc_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rnc_occurrences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rnc_occurrences_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      rnc_participants: {
        Row: {
          created_at: string
          id: string
          rnc_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rnc_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rnc_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rnc_participants_rnc_id_fkey"
            columns: ["rnc_id"]
            isOneToOne: false
            referencedRelation: "rnc_occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      rnc_stages: {
        Row: {
          completed_at: string | null
          created_at: string
          deadline: string | null
          id: string
          rejection_reason: string | null
          responsible_sector_id: string | null
          responsible_user_id: string | null
          rnc_id: string
          stage_name: string
          stage_number: number
          status: Database["public"]["Enums"]["stage_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          rejection_reason?: string | null
          responsible_sector_id?: string | null
          responsible_user_id?: string | null
          rnc_id: string
          stage_name: string
          stage_number: number
          status?: Database["public"]["Enums"]["stage_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          rejection_reason?: string | null
          responsible_sector_id?: string | null
          responsible_user_id?: string | null
          rnc_id?: string
          stage_name?: string
          stage_number?: number
          status?: Database["public"]["Enums"]["stage_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rnc_stages_responsible_sector_id_fkey"
            columns: ["responsible_sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rnc_stages_rnc_id_fkey"
            columns: ["rnc_id"]
            isOneToOne: false
            referencedRelation: "rnc_occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      company_type: "obra" | "escritorio"
      criticality_level: "baixa" | "media" | "alta"
      occurrence_type: "real" | "potencial" | "oportunidade"
      risk_frequency:
        | "por_evento"
        | "diario"
        | "semanal"
        | "mensal"
        | "trimestral"
        | "anual"
      risk_response:
        | "aceitar"
        | "compartilhar"
        | "eliminar"
        | "minimizar"
        | "evitar"
      risk_status:
        | "em_andamento"
        | "concluido"
        | "iniciar"
        | "sem_previsao"
        | "acao_constante"
      rnc_status:
        | "aberta"
        | "triagem"
        | "analise_causa"
        | "plano_acao"
        | "validacao"
        | "implementacao"
        | "eficacia"
        | "concluida"
        | "recusada"
      stage_status:
        | "pendente"
        | "em_andamento"
        | "aprovado"
        | "reprovado"
        | "concluido"
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
      app_role: ["admin", "user"],
      company_type: ["obra", "escritorio"],
      criticality_level: ["baixa", "media", "alta"],
      occurrence_type: ["real", "potencial", "oportunidade"],
      risk_frequency: [
        "por_evento",
        "diario",
        "semanal",
        "mensal",
        "trimestral",
        "anual",
      ],
      risk_response: [
        "aceitar",
        "compartilhar",
        "eliminar",
        "minimizar",
        "evitar",
      ],
      risk_status: [
        "em_andamento",
        "concluido",
        "iniciar",
        "sem_previsao",
        "acao_constante",
      ],
      rnc_status: [
        "aberta",
        "triagem",
        "analise_causa",
        "plano_acao",
        "validacao",
        "implementacao",
        "eficacia",
        "concluida",
        "recusada",
      ],
      stage_status: [
        "pendente",
        "em_andamento",
        "aprovado",
        "reprovado",
        "concluido",
      ],
    },
  },
} as const
