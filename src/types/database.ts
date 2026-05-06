export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          plan: "free" | "pro";
          language: string;
          notify_breach: boolean;
          notify_new_account: boolean;
          last_scan_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          plan?: "free" | "pro";
          language?: string;
          notify_breach?: boolean;
          notify_new_account?: boolean;
          last_scan_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          plan?: "free" | "pro";
          language?: string;
          notify_breach?: boolean;
          notify_new_account?: boolean;
          last_scan_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      scan_results: {
        Row: {
          id: string;
          user_id: string;
          service_name: string;
          service_domain: string;
          first_detected_at: string;
          last_email_date: string | null;
          breach_status: "safe" | "breached" | "unknown";
          breach_count: number;
          breach_last_checked: string | null;
          deletion_status: "active" | "deleted" | "ignored";
          deletion_url: string | null;
          deletion_difficulty: "easy" | "medium" | "hard" | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_name: string;
          service_domain: string;
          first_detected_at?: string;
          last_email_date?: string | null;
          breach_status?: "safe" | "breached" | "unknown";
          breach_count?: number;
          breach_last_checked?: string | null;
          deletion_status?: "active" | "deleted" | "ignored";
          deletion_url?: string | null;
          deletion_difficulty?: "easy" | "medium" | "hard" | null;
          updated_at?: string;
        };
        Update: {
          service_name?: string;
          service_domain?: string;
          last_email_date?: string | null;
          breach_status?: "safe" | "breached" | "unknown";
          breach_count?: number;
          breach_last_checked?: string | null;
          deletion_status?: "active" | "deleted" | "ignored";
          deletion_url?: string | null;
          deletion_difficulty?: "easy" | "medium" | "hard" | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scan_results_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      breach_alerts: {
        Row: {
          id: string;
          user_id: string;
          service_name: string;
          breach_name: string;
          breach_date: string | null;
          data_types: string[];
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_name: string;
          breach_name: string;
          breach_date?: string | null;
          data_types?: string[];
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "breach_alerts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ScanResult = Database["public"]["Tables"]["scan_results"]["Row"];
export type BreachAlert = Database["public"]["Tables"]["breach_alerts"]["Row"];
