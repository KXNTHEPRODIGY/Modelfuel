// Hand-written to match supabase/migrations/0001_init.sql. Shaped like the
// output of `supabase gen types typescript` so it can be swapped for generated
// types later without churn.

export type TrainingStage =
  | "pretraining"
  | "sft"
  | "rlhf"
  | "dpo"
  | "eval"
  | "other";

export interface Database {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string;
          seller_address: string;
          title: string;
          description: string | null;
          price_ip: number | null;
          training_stage: TrainingStage | null;
          main_vault_id: string | null;
          ip_id: string | null;
          license_terms_id: string | null;
          license_token_address: string | null;
          sample_cid: string | null;
          expires_at: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          seller_address: string;
          title: string;
          description?: string | null;
          price_ip?: number | null;
          training_stage?: TrainingStage | null;
          main_vault_id?: string | null;
          ip_id?: string | null;
          license_terms_id?: string | null;
          license_token_address?: string | null;
          sample_cid?: string | null;
          expires_at?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          seller_address?: string;
          title?: string;
          description?: string | null;
          price_ip?: number | null;
          training_stage?: TrainingStage | null;
          main_vault_id?: string | null;
          ip_id?: string | null;
          license_terms_id?: string | null;
          license_token_address?: string | null;
          sample_cid?: string | null;
          expires_at?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      purchases: {
        Row: {
          id: string;
          listing_id: string;
          buyer_address: string;
          license_token_id: string | null;
          tx_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_address: string;
          license_token_id?: string | null;
          tx_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          buyer_address?: string;
          license_token_id?: string | null;
          tx_hash?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      training_stage: TrainingStage;
    };
    CompositeTypes: Record<never, never>;
  };
}

// Convenience row aliases.
export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
export type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];
export type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
export type PurchaseInsert = Database["public"]["Tables"]["purchases"]["Insert"];
