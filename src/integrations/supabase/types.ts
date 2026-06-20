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
      amenities: {
        Row: {
          address: string | null
          category: string | null
          distance_miles: number | null
          id: string
          name: string | null
          place_id: string | null
          rating: number | null
          report_id: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          distance_miles?: number | null
          id?: string
          name?: string | null
          place_id?: string | null
          rating?: number | null
          report_id?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          distance_miles?: number | null
          id?: string
          name?: string | null
          place_id?: string | null
          rating?: number | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "amenities_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_officials: {
        Row: {
          contact_phone: string | null
          contact_url: string | null
          district_number: string | null
          id: string
          name: string | null
          office: string | null
          party: string | null
          report_id: string | null
        }
        Insert: {
          contact_phone?: string | null
          contact_url?: string | null
          district_number?: string | null
          id?: string
          name?: string | null
          office?: string | null
          party?: string | null
          report_id?: string | null
        }
        Update: {
          contact_phone?: string | null
          contact_url?: string | null
          district_number?: string | null
          id?: string
          name?: string | null
          office?: string | null
          party?: string | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_officials_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ownership_history: {
        Row: {
          document_type: string | null
          id: string
          owner_name: string | null
          property_id: string | null
          recorder_doc_number: string | null
          sale_price: number | null
          transfer_date: string | null
        }
        Insert: {
          document_type?: string | null
          id?: string
          owner_name?: string | null
          property_id?: string | null
          recorder_doc_number?: string | null
          sale_price?: number | null
          transfer_date?: string | null
        }
        Update: {
          document_type?: string | null
          id?: string
          owner_name?: string | null
          property_id?: string | null
          recorder_doc_number?: string | null
          sale_price?: number | null
          transfer_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ownership_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "report_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_line: string
          bathrooms: number | null
          bedrooms: number | null
          city: string
          claimed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          property_type: string | null
          square_feet: number | null
          state: string
          updated_at: string
          year_built: number | null
          zip: string
        }
        Insert: {
          address_line: string
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          property_type?: string | null
          square_feet?: number | null
          state: string
          updated_at?: string
          year_built?: number | null
          zip: string
        }
        Update: {
          address_line?: string
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          property_type?: string | null
          square_feet?: number | null
          state?: string
          updated_at?: string
          year_built?: number | null
          zip?: string
        }
        Relationships: []
      }
      property_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          property_id: string
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          property_id: string
          role: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          property_id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_chat_messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_records: {
        Row: {
          category: string
          cost: number | null
          created_at: string
          description: string | null
          id: string
          performed_at: string | null
          performed_by: string | null
          property_id: string
          submitted_by: string | null
          submitter_role: Database["public"]["Enums"]["app_role"] | null
          title: string
          updated_at: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          category: string
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          property_id: string
          submitted_by?: string | null
          submitter_role?: Database["public"]["Enums"]["app_role"] | null
          title: string
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          category?: string
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          property_id?: string
          submitted_by?: string | null
          submitter_role?: Database["public"]["Enums"]["app_role"] | null
          title?: string
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_records_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_reports: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          payload: Json
          property_id: string
          report_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          payload: Json
          property_id: string
          report_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          property_id?: string
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      record_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          record_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          record_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          record_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "record_attachments_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "property_records"
            referencedColumns: ["id"]
          },
        ]
      }
      report_exports: {
        Row: {
          generated_at: string
          id: string
          pdf_url: string | null
          report_id: string | null
        }
        Insert: {
          generated_at?: string
          id?: string
          pdf_url?: string | null
          report_id?: string | null
        }
        Update: {
          generated_at?: string
          id?: string
          pdf_url?: string | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_exports_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_properties: {
        Row: {
          assessed_value: number | null
          bathrooms: number | null
          bedrooms: number | null
          gis_map_url: string | null
          id: string
          last_sale_date: string | null
          last_sale_price: number | null
          legal_description: string | null
          living_area_sqft: number | null
          lot_size_sqft: number | null
          market_value: number | null
          parcel_id: string | null
          property_type: string | null
          report_id: string | null
          year_built: number | null
          zoning: string | null
        }
        Insert: {
          assessed_value?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          gis_map_url?: string | null
          id?: string
          last_sale_date?: string | null
          last_sale_price?: number | null
          legal_description?: string | null
          living_area_sqft?: number | null
          lot_size_sqft?: number | null
          market_value?: number | null
          parcel_id?: string | null
          property_type?: string | null
          report_id?: string | null
          year_built?: number | null
          zoning?: string | null
        }
        Update: {
          assessed_value?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          gis_map_url?: string | null
          id?: string
          last_sale_date?: string | null
          last_sale_price?: number | null
          legal_description?: string | null
          living_area_sqft?: number | null
          lot_size_sqft?: number | null
          market_value?: number | null
          parcel_id?: string | null
          property_type?: string | null
          report_id?: string | null
          year_built?: number | null
          zoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_properties_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_sections: {
        Row: {
          data: Json | null
          fetched_at: string | null
          id: string
          report_id: string
          section_key: string
          source: string | null
          status: string
        }
        Insert: {
          data?: Json | null
          fetched_at?: string | null
          id?: string
          report_id: string
          section_key: string
          source?: string | null
          status?: string
        }
        Update: {
          data?: Json | null
          fetched_at?: string | null
          id?: string
          report_id?: string
          section_key?: string
          source?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_sections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          address_normalized: string | null
          address_raw: string
          anon_token: string | null
          county: string | null
          created_at: string
          id: string
          last_refreshed_at: string | null
          lat: number | null
          lng: number | null
          parcel_id: string | null
          place_id: string | null
          state: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          address_normalized?: string | null
          address_raw: string
          anon_token?: string | null
          county?: string | null
          created_at?: string
          id?: string
          last_refreshed_at?: string | null
          lat?: number | null
          lng?: number | null
          parcel_id?: string | null
          place_id?: string | null
          state?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          address_normalized?: string | null
          address_raw?: string
          anon_token?: string | null
          county?: string | null
          created_at?: string
          id?: string
          last_refreshed_at?: string | null
          lat?: number | null
          lng?: number | null
          parcel_id?: string | null
          place_id?: string | null
          state?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      risk_indicators: {
        Row: {
          environmental_notes: string[] | null
          fema_panel_url: string | null
          flood_zone: string | null
          flood_zone_description: string | null
          id: string
          report_id: string | null
          storm_events: Json | null
          wildfire_risk_tier: string | null
        }
        Insert: {
          environmental_notes?: string[] | null
          fema_panel_url?: string | null
          flood_zone?: string | null
          flood_zone_description?: string | null
          id?: string
          report_id?: string | null
          storm_events?: Json | null
          wildfire_risk_tier?: string | null
        }
        Update: {
          environmental_notes?: string[] | null
          fema_panel_url?: string | null
          flood_zone?: string | null
          flood_zone_description?: string | null
          id?: string
          report_id?: string | null
          storm_events?: Json | null
          wildfire_risk_tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_indicators_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          distance_miles: number | null
          district_name: string | null
          id: string
          level: string | null
          name: string | null
          phone: string | null
          rating: number | null
          rating_source: string | null
          report_id: string | null
        }
        Insert: {
          address?: string | null
          distance_miles?: number | null
          district_name?: string | null
          id?: string
          level?: string | null
          name?: string | null
          phone?: string | null
          rating?: number | null
          rating_source?: string | null
          report_id?: string | null
        }
        Update: {
          address?: string | null
          distance_miles?: number | null
          district_name?: string | null
          id?: string
          level?: string | null
          name?: string | null
          phone?: string | null
          rating?: number | null
          rating_source?: string | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      scorecards: {
        Row: {
          amenities_score: number | null
          best_for: string[] | null
          commute_score: number | null
          computed_at: string
          cons: string[] | null
          crime_score: number | null
          headline: string | null
          id: string
          living_outlook_grade: string | null
          living_outlook_score: number | null
          market_score: number | null
          methodology_version: string | null
          pros: string[] | null
          report_id: string | null
          risk_score: number | null
          schools_score: number | null
          summary: string | null
          tax_burden_score: number | null
        }
        Insert: {
          amenities_score?: number | null
          best_for?: string[] | null
          commute_score?: number | null
          computed_at?: string
          cons?: string[] | null
          crime_score?: number | null
          headline?: string | null
          id?: string
          living_outlook_grade?: string | null
          living_outlook_score?: number | null
          market_score?: number | null
          methodology_version?: string | null
          pros?: string[] | null
          report_id?: string | null
          risk_score?: number | null
          schools_score?: number | null
          summary?: string | null
          tax_burden_score?: number | null
        }
        Update: {
          amenities_score?: number | null
          best_for?: string[] | null
          commute_score?: number | null
          computed_at?: string
          cons?: string[] | null
          crime_score?: number | null
          headline?: string | null
          id?: string
          living_outlook_grade?: string | null
          living_outlook_score?: number | null
          market_score?: number | null
          methodology_version?: string | null
          pros?: string[] | null
          report_id?: string | null
          risk_score?: number | null
          schools_score?: number | null
          summary?: string | null
          tax_burden_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scorecards_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          property_id: string
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          property_id: string
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          property_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_history: {
        Row: {
          assessed_value: number | null
          exemptions: string[] | null
          id: string
          property_id: string | null
          tax_year: number | null
          taxable_value: number | null
          total_tax: number | null
        }
        Insert: {
          assessed_value?: number | null
          exemptions?: string[] | null
          id?: string
          property_id?: string | null
          tax_year?: number | null
          taxable_value?: number | null
          total_tax?: number | null
        }
        Update: {
          assessed_value?: number | null
          exemptions?: string[] | null
          id?: string
          property_id?: string | null
          tax_year?: number | null
          taxable_value?: number | null
          total_tax?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "report_properties"
            referencedColumns: ["id"]
          },
        ]
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
      utilities: {
        Row: {
          contact_phone: string | null
          contact_url: string | null
          id: string
          notes: string | null
          provider_name: string | null
          report_id: string | null
          utility_type: string | null
        }
        Insert: {
          contact_phone?: string | null
          contact_url?: string | null
          id?: string
          notes?: string | null
          provider_name?: string | null
          report_id?: string | null
          utility_type?: string | null
        }
        Update: {
          contact_phone?: string | null
          contact_url?: string | null
          id?: string
          notes?: string | null
          provider_name?: string | null
          report_id?: string | null
          utility_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "utilities_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_info: {
        Row: {
          closest_city_hall_address: string | null
          closest_dmv_address: string | null
          closest_dmv_distance_miles: number | null
          closest_dmv_name: string | null
          election_authority: string | null
          election_authority_url: string | null
          id: string
          polling_place_address: string | null
          polling_place_name: string | null
          report_id: string | null
        }
        Insert: {
          closest_city_hall_address?: string | null
          closest_dmv_address?: string | null
          closest_dmv_distance_miles?: number | null
          closest_dmv_name?: string | null
          election_authority?: string | null
          election_authority_url?: string | null
          id?: string
          polling_place_address?: string | null
          polling_place_name?: string | null
          report_id?: string | null
        }
        Update: {
          closest_city_hall_address?: string | null
          closest_dmv_address?: string | null
          closest_dmv_distance_miles?: number | null
          closest_dmv_name?: string | null
          election_authority?: string | null
          election_authority_url?: string | null
          id?: string
          polling_place_address?: string | null
          polling_place_name?: string | null
          report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voting_info_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "homeowner" | "realtor" | "contractor" | "admin"
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
      app_role: ["homeowner", "realtor", "contractor", "admin"],
    },
  },
} as const
