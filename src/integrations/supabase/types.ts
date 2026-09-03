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
      achievements: {
        Row: {
          category: string
          code: string
          created_at: string
          criteria: Json
          description: string
          icon: string
          id: string
          name: string
          xp_reward: number
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          criteria: Json
          description: string
          icon: string
          id?: string
          name: string
          xp_reward?: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          name?: string
          xp_reward?: number
        }
        Relationships: []
      }
      analytics: {
        Row: {
          average_score: number | null
          created_at: string
          date: string
          id: string
          metadata: Json | null
          quizzes_taken: number | null
          sessions_completed: number | null
          total_focus_minutes: number | null
          total_study_minutes: number | null
          user_id: string
        }
        Insert: {
          average_score?: number | null
          created_at?: string
          date: string
          id?: string
          metadata?: Json | null
          quizzes_taken?: number | null
          sessions_completed?: number | null
          total_focus_minutes?: number | null
          total_study_minutes?: number | null
          user_id: string
        }
        Update: {
          average_score?: number | null
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          quizzes_taken?: number | null
          sessions_completed?: number | null
          total_focus_minutes?: number | null
          total_study_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      country_news_cache: {
        Row: {
          country: string
          created_at: string
          id: string
          news_date: string
          payload: Json
        }
        Insert: {
          country: string
          created_at?: string
          id?: string
          news_date: string
          payload: Json
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          news_date?: string
          payload?: Json
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          priority: string
          status: string
          subject: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          priority?: string
          status?: string
          subject: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string
          status?: string
          subject?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          exam_date: string | null
          exam_type: Database["public"]["Enums"]["exam_type"]
          id: string
          language: string
          level: number | null
          name: string
          streak: number | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          timezone: string | null
          updated_at: string
          xp: number | null
        }
        Insert: {
          created_at?: string
          exam_date?: string | null
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id: string
          language?: string
          level?: number | null
          name: string
          streak?: number | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          timezone?: string | null
          updated_at?: string
          xp?: number | null
        }
        Update: {
          created_at?: string
          exam_date?: string | null
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          language?: string
          level?: number | null
          name?: string
          streak?: number | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          timezone?: string | null
          updated_at?: string
          xp?: number | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          metadata: Json | null
          options: Json | null
          question_text: string
          question_type: string
          subject: string
          topic: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          metadata?: Json | null
          options?: Json | null
          question_text: string
          question_type?: string
          subject: string
          topic?: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          metadata?: Json | null
          options?: Json | null
          question_text?: string
          question_type?: string
          subject?: string
          topic?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answered_questions: number | null
          completed_at: string | null
          created_at: string
          feedback: Json | null
          grading_results: Json | null
          id: string
          questions: Json
          quiz_type: string
          score: number | null
          started_at: string
          status: string
          subject: string
          time_limit: number
          time_taken: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          answered_questions?: number | null
          completed_at?: string | null
          created_at?: string
          feedback?: Json | null
          grading_results?: Json | null
          id?: string
          questions?: Json
          quiz_type: string
          score?: number | null
          started_at?: string
          status?: string
          subject: string
          time_limit?: number
          time_taken?: number | null
          total_questions?: number
          user_id: string
        }
        Update: {
          answered_questions?: number | null
          completed_at?: string | null
          created_at?: string
          feedback?: Json | null
          grading_results?: Json | null
          id?: string
          questions?: Json
          quiz_type?: string
          score?: number | null
          started_at?: string
          status?: string
          subject?: string
          time_limit?: number
          time_taken?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          created_at: string
          duration: number
          id: string
          questions_meta: Json
          score: number
          subject: Database["public"]["Enums"]["subject_type"]
          type: Database["public"]["Enums"]["quiz_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          duration: number
          id?: string
          questions_meta: Json
          score: number
          subject: Database["public"]["Enums"]["subject_type"]
          type: Database["public"]["Enums"]["quiz_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number
          id?: string
          questions_meta?: Json
          score?: number
          subject?: Database["public"]["Enums"]["subject_type"]
          type?: Database["public"]["Enums"]["quiz_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          device: string | null
          duration: number | null
          end_ts: string | null
          focus_time: number | null
          id: string
          notes: string | null
          start_ts: string
          subject: Database["public"]["Enums"]["subject_type"]
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device?: string | null
          duration?: number | null
          end_ts?: string | null
          focus_time?: number | null
          id?: string
          notes?: string | null
          start_ts?: string
          subject: Database["public"]["Enums"]["subject_type"]
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string
          device?: string | null
          duration?: number | null
          end_ts?: string | null
          focus_time?: number | null
          id?: string
          notes?: string | null
          start_ts?: string
          subject?: Database["public"]["Enums"]["subject_type"]
          topic?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_items: {
        Row: {
          created_at: string
          date: string
          id: string
          metadata: Json | null
          planned_duration: number
          status: Database["public"]["Enums"]["session_status"] | null
          subject: Database["public"]["Enums"]["subject_type"]
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          metadata?: Json | null
          planned_duration: number
          status?: Database["public"]["Enums"]["session_status"] | null
          subject: Database["public"]["Enums"]["subject_type"]
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          planned_duration?: number
          status?: Database["public"]["Enums"]["session_status"] | null
          subject?: Database["public"]["Enums"]["subject_type"]
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: Json | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: Json | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: Json | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          daily_hours: number
          focus_duration: number
          id: string
          notifications: Json | null
          preferred_slots: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_hours?: number
          focus_duration?: number
          id?: string
          notifications?: Json | null
          preferred_slots?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_hours?: number
          focus_duration?: number
          id?: string
          notifications?: Json | null
          preferred_slots?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      exam_type: "upsc" | "state_psc"
      quiz_type: "topic_wise" | "full_length" | "daily"
      session_status: "planned" | "in_progress" | "completed" | "missed"
      subject_type:
        | "history"
        | "geography"
        | "polity"
        | "economics"
        | "science_tech"
        | "ethics"
        | "current_affairs"
      subscription_status: "free" | "premium"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      exam_type: ["upsc", "state_psc"],
      quiz_type: ["topic_wise", "full_length", "daily"],
      session_status: ["planned", "in_progress", "completed", "missed"],
      subject_type: [
        "history",
        "geography",
        "polity",
        "economics",
        "science_tech",
        "ethics",
        "current_affairs",
      ],
      subscription_status: ["free", "premium"],
    },
  },
} as const
