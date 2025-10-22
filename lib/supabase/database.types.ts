export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          organization_id: string | null
          color: string
          supervisor_initials: string | null
          dispatcher_initials: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          organization_id?: string | null
          color?: string
          supervisor_initials?: string | null
          dispatcher_initials?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          organization_id?: string | null
          color?: string
          supervisor_initials?: string | null
          dispatcher_initials?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      technicians: {
        Row: {
          id: string
          first_name: string
          last_name: string
          initials: string
          team_id: string | null
          profile_picture_url: string | null
          email: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          initials: string
          team_id?: string | null
          profile_picture_url?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          initials?: string
          team_id?: string | null
          profile_picture_url?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      competency_assessments: {
        Row: {
          id: string
          technician_id: string | null
          assessment_date: string | null
          last_updated: string
          vestas_level: string | null
          internal_experience: string | null
          internal_experience_points: number
          external_experience: string | null
          external_experience_points: number
          education_type: string | null
          education_points: number
          extra_courses: Json
          extra_courses_points: number
          subjective_score: number
          experience_multiplier: number
          total_points: number
          multiplied_experience_points: number
          final_level: number | null
          is_signed: boolean
          signed_date: string | null
          submitted_to_ecc: boolean
          submitted_date: string | null
          submitted_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          technician_id?: string | null
          assessment_date?: string | null
          last_updated?: string
          vestas_level?: string | null
          internal_experience?: string | null
          internal_experience_points?: number
          external_experience?: string | null
          external_experience_points?: number
          education_type?: string | null
          education_points?: number
          extra_courses?: Json
          extra_courses_points?: number
          subjective_score?: number
          experience_multiplier?: number
          total_points?: number
          multiplied_experience_points?: number
          final_level?: number | null
          is_signed?: boolean
          signed_date?: string | null
          submitted_to_ecc?: boolean
          submitted_date?: string | null
          submitted_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          technician_id?: string | null
          assessment_date?: string | null
          last_updated?: string
          vestas_level?: string | null
          internal_experience?: string | null
          internal_experience_points?: number
          external_experience?: string | null
          external_experience_points?: number
          education_type?: string | null
          education_points?: number
          extra_courses?: Json
          extra_courses_points?: number
          subjective_score?: number
          experience_multiplier?: number
          total_points?: number
          multiplied_experience_points?: number
          final_level?: number | null
          is_signed?: boolean
          signed_date?: string | null
          submitted_to_ecc?: boolean
          submitted_date?: string | null
          submitted_by?: string | null
          created_at?: string
        }
      }
      service_vehicles: {
        Row: {
          id: string
          registration: string
          team_id: string | null
          specs: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          registration: string
          team_id?: string | null
          specs?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          registration?: string
          team_id?: string | null
          specs?: Json
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          name: string
          code: string | null
          category: string
          type: string
          validity_period_months: number | null
          prerequisites: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          category: string
          type: string
          validity_period_months?: number | null
          prerequisites?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          category?: string
          type?: string
          validity_period_months?: number | null
          prerequisites?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
