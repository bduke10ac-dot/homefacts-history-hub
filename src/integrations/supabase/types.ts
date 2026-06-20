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
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          key_hash: string
          last_used_at: string | null
          scopes: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_hash: string
          last_used_at?: string | null
          scopes?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key_hash?: string
          last_used_at?: string | null
          scopes?: string[] | null
          user_id?: string
        }
        Relationships: []
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
      civic_services_nearby: {
        Row: {
          address: string | null
          distance_miles: number | null
          hours: string | null
          id: string
          name: string | null
          phone: string | null
          property_id: string | null
          service_type: string | null
        }
        Insert: {
          address?: string | null
          distance_miles?: number | null
          hours?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          property_id?: string | null
          service_type?: string | null
        }
        Update: {
          address?: string | null
          distance_miles?: number | null
          hours?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          property_id?: string | null
          service_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "civic_services_nearby_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      code_violations: {
        Row: {
          closed_date: string | null
          description: string | null
          fine_amount: number | null
          id: string
          opened_date: string | null
          property_id: string | null
          source_url: string | null
          status: string | null
          violation_number: string | null
          violation_type: string | null
        }
        Insert: {
          closed_date?: string | null
          description?: string | null
          fine_amount?: number | null
          id?: string
          opened_date?: string | null
          property_id?: string | null
          source_url?: string | null
          status?: string | null
          violation_number?: string | null
          violation_type?: string | null
        }
        Update: {
          closed_date?: string | null
          description?: string | null
          fine_amount?: number | null
          id?: string
          opened_date?: string | null
          property_id?: string | null
          source_url?: string | null
          status?: string | null
          violation_number?: string | null
          violation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "code_violations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          bond_status: string | null
          company_name: string | null
          complaints_count: number | null
          complaints_detail: Json | null
          contractor_name: string | null
          expiration_date: string | null
          id: string
          insurance_status: string | null
          issuing_state_agency: string | null
          license_number: string | null
          license_status: string | null
          license_type: string | null
          source_link: string | null
          trade_type: string | null
          verification_score: number | null
          verified_date: string | null
          workers_comp_status: string | null
        }
        Insert: {
          bond_status?: string | null
          company_name?: string | null
          complaints_count?: number | null
          complaints_detail?: Json | null
          contractor_name?: string | null
          expiration_date?: string | null
          id?: string
          insurance_status?: string | null
          issuing_state_agency?: string | null
          license_number?: string | null
          license_status?: string | null
          license_type?: string | null
          source_link?: string | null
          trade_type?: string | null
          verification_score?: number | null
          verified_date?: string | null
          workers_comp_status?: string | null
        }
        Update: {
          bond_status?: string | null
          company_name?: string | null
          complaints_count?: number | null
          complaints_detail?: Json | null
          contractor_name?: string | null
          expiration_date?: string | null
          id?: string
          insurance_status?: string | null
          issuing_state_agency?: string | null
          license_number?: string | null
          license_status?: string | null
          license_type?: string | null
          source_link?: string | null
          trade_type?: string | null
          verification_score?: number | null
          verified_date?: string | null
          workers_comp_status?: string | null
        }
        Relationships: []
      }
      crime_reports: {
        Row: {
          area_id: string
          category: string | null
          id: string
          incident_date: string | null
          report_type: string | null
          source_url: string | null
        }
        Insert: {
          area_id: string
          category?: string | null
          id?: string
          incident_date?: string | null
          report_type?: string | null
          source_url?: string | null
        }
        Update: {
          area_id?: string
          category?: string | null
          id?: string
          incident_date?: string | null
          report_type?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      crime_trend_summary: {
        Row: {
          area_id: string
          id: string
          period: string
          property_crime_rate: number | null
          source_url: string | null
          trend_direction: string | null
          violent_crime_rate: number | null
        }
        Insert: {
          area_id: string
          id?: string
          period: string
          property_crime_rate?: number | null
          source_url?: string | null
          trend_direction?: string | null
          violent_crime_rate?: number | null
        }
        Update: {
          area_id?: string
          id?: string
          period?: string
          property_crime_rate?: number | null
          source_url?: string | null
          trend_direction?: string | null
          violent_crime_rate?: number | null
        }
        Relationships: []
      }
      data_source_log: {
        Row: {
          data_license_status: string | null
          fetched_at: string | null
          id: string
          record_id: string
          source_name: string | null
          source_url: string | null
          table_name: string
        }
        Insert: {
          data_license_status?: string | null
          fetched_at?: string | null
          id?: string
          record_id: string
          source_name?: string | null
          source_url?: string | null
          table_name: string
        }
        Update: {
          data_license_status?: string | null
          fetched_at?: string | null
          id?: string
          record_id?: string
          source_name?: string | null
          source_url?: string | null
          table_name?: string
        }
        Relationships: []
      }
      env_claim_predictions: {
        Row: {
          created_at: string
          created_by: string | null
          disclaimer: string
          horizon_months: number | null
          id: string
          is_certified: boolean
          model: string
          predicted_claim_type: string | null
          predicted_probability: number | null
          prompt: string | null
          property_id: string
          response_json: Json
          response_text: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          disclaimer: string
          horizon_months?: number | null
          id?: string
          is_certified?: boolean
          model: string
          predicted_claim_type?: string | null
          predicted_probability?: number | null
          prompt?: string | null
          property_id: string
          response_json?: Json
          response_text?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          disclaimer?: string
          horizon_months?: number | null
          id?: string
          is_certified?: boolean
          model?: string
          predicted_claim_type?: string | null
          predicted_probability?: number | null
          prompt?: string | null
          property_id?: string
          response_json?: Json
          response_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "env_claim_predictions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      env_events: {
        Row: {
          created_at: string
          description: string | null
          distance_miles: number | null
          event_date: string
          event_type: string
          external_id: string | null
          id: string
          magnitude: number | null
          magnitude_unit: string | null
          property_id: string | null
          raw: Json
          severity: string | null
          source: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          distance_miles?: number | null
          event_date: string
          event_type: string
          external_id?: string | null
          id?: string
          magnitude?: number | null
          magnitude_unit?: string | null
          property_id?: string | null
          raw?: Json
          severity?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          distance_miles?: number | null
          event_date?: string
          event_type?: string
          external_id?: string | null
          id?: string
          magnitude?: number | null
          magnitude_unit?: string | null
          property_id?: string | null
          raw?: Json
          severity?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "env_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      env_flood_intelligence: {
        Row: {
          base_flood_elevation_ft: number | null
          created_at: string
          elevation_ft: number | null
          fema_zone: string | null
          flood_insurance_required: boolean | null
          id: string
          in_floodway: boolean | null
          last_flood_event_date: string | null
          metadata: Json
          property_id: string
          source: string
          updated_at: string
        }
        Insert: {
          base_flood_elevation_ft?: number | null
          created_at?: string
          elevation_ft?: number | null
          fema_zone?: string | null
          flood_insurance_required?: boolean | null
          id?: string
          in_floodway?: boolean | null
          last_flood_event_date?: string | null
          metadata?: Json
          property_id: string
          source?: string
          updated_at?: string
        }
        Update: {
          base_flood_elevation_ft?: number | null
          created_at?: string
          elevation_ft?: number | null
          fema_zone?: string | null
          flood_insurance_required?: boolean | null
          id?: string
          in_floodway?: boolean | null
          last_flood_event_date?: string | null
          metadata?: Json
          property_id?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "env_flood_intelligence_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      env_grade: {
        Row: {
          breakdown: Json
          computed_at: string
          grade: string
          id: string
          property_id: string
          score: number | null
          updated_at: string
        }
        Insert: {
          breakdown?: Json
          computed_at?: string
          grade: string
          id?: string
          property_id: string
          score?: number | null
          updated_at?: string
        }
        Update: {
          breakdown?: Json
          computed_at?: string
          grade?: string
          id?: string
          property_id?: string
          score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "env_grade_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      env_risk_scores: {
        Row: {
          computed_at: string
          earthquake_risk_level: string | null
          flood_risk_level: string | null
          hail_risk_level: string | null
          id: string
          metadata: Json
          overall_risk_score: number | null
          property_id: string
          source: string
          tornado_risk_level: string | null
          updated_at: string
          wildfire_risk_level: string | null
          wind_risk_level: string | null
          winter_risk_level: string | null
        }
        Insert: {
          computed_at?: string
          earthquake_risk_level?: string | null
          flood_risk_level?: string | null
          hail_risk_level?: string | null
          id?: string
          metadata?: Json
          overall_risk_score?: number | null
          property_id: string
          source?: string
          tornado_risk_level?: string | null
          updated_at?: string
          wildfire_risk_level?: string | null
          wind_risk_level?: string | null
          winter_risk_level?: string | null
        }
        Update: {
          computed_at?: string
          earthquake_risk_level?: string | null
          flood_risk_level?: string | null
          hail_risk_level?: string | null
          id?: string
          metadata?: Json
          overall_risk_score?: number | null
          property_id?: string
          source?: string
          tornado_risk_level?: string | null
          updated_at?: string
          wildfire_risk_level?: string | null
          wind_risk_level?: string | null
          winter_risk_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "env_risk_scores_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      env_roof_stress_assessments: {
        Row: {
          created_at: string
          created_by: string | null
          disclaimer: string
          estimated_remaining_life_years: number | null
          id: string
          is_certified: boolean
          model: string
          prompt: string | null
          property_id: string
          response_json: Json
          response_text: string | null
          stress_level: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          disclaimer: string
          estimated_remaining_life_years?: number | null
          id?: string
          is_certified?: boolean
          model: string
          prompt?: string | null
          property_id: string
          response_json?: Json
          response_text?: string | null
          stress_level?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          disclaimer?: string
          estimated_remaining_life_years?: number | null
          id?: string
          is_certified?: boolean
          model?: string
          prompt?: string | null
          property_id?: string
          response_json?: Json
          response_text?: string | null
          stress_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "env_roof_stress_assessments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      environmental_risks: {
        Row: {
          id: string
          property_id: string | null
          risk_level: string | null
          risk_type: string | null
          source_url: string | null
        }
        Insert: {
          id?: string
          property_id?: string | null
          risk_level?: string | null
          risk_type?: string | null
          source_url?: string | null
        }
        Update: {
          id?: string
          property_id?: string | null
          risk_level?: string | null
          risk_type?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "environmental_risks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_flags: {
        Row: {
          detail: string | null
          detected_at: string | null
          flag_type: string | null
          id: string
          permit_id: string | null
          professional_id: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_note: string | null
          severity: string | null
        }
        Insert: {
          detail?: string | null
          detected_at?: string | null
          flag_type?: string | null
          id?: string
          permit_id?: string | null
          professional_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_note?: string | null
          severity?: string | null
        }
        Update: {
          detail?: string | null
          detected_at?: string | null
          flag_type?: string | null
          id?: string
          permit_id?: string | null
          professional_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_note?: string | null
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_flags_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_flags_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          claim_date: string | null
          claim_type: string | null
          data_license_status: string | null
          id: string
          peril: string | null
          property_id: string | null
          source_url: string | null
          status: string | null
        }
        Insert: {
          claim_date?: string | null
          claim_type?: string | null
          data_license_status?: string | null
          id?: string
          peril?: string | null
          property_id?: string | null
          source_url?: string | null
          status?: string | null
        }
        Update: {
          claim_date?: string | null
          claim_type?: string | null
          data_license_status?: string | null
          id?: string
          peril?: string | null
          property_id?: string | null
          source_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      living_outlook_scores: {
        Row: {
          commute_score: number | null
          computed_at: string | null
          crime_score: number | null
          development_score: number | null
          growth_potential_score: number | null
          healthcare_score: number | null
          id: string
          market_growth_score: number | null
          methodology_version: string | null
          overall_score: number | null
          parks_score: number | null
          property_id: string | null
          schools_score: number | null
          shopping_score: number | null
          stability_score: number | null
          tax_score: number | null
          utilities_score: number | null
        }
        Insert: {
          commute_score?: number | null
          computed_at?: string | null
          crime_score?: number | null
          development_score?: number | null
          growth_potential_score?: number | null
          healthcare_score?: number | null
          id?: string
          market_growth_score?: number | null
          methodology_version?: string | null
          overall_score?: number | null
          parks_score?: number | null
          property_id?: string | null
          schools_score?: number | null
          shopping_score?: number | null
          stability_score?: number | null
          tax_score?: number | null
          utilities_score?: number | null
        }
        Update: {
          commute_score?: number | null
          computed_at?: string | null
          crime_score?: number | null
          development_score?: number | null
          growth_potential_score?: number | null
          healthcare_score?: number | null
          id?: string
          market_growth_score?: number | null
          methodology_version?: string | null
          overall_score?: number | null
          parks_score?: number | null
          property_id?: string | null
          schools_score?: number | null
          shopping_score?: number | null
          stability_score?: number | null
          tax_score?: number | null
          utilities_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "living_outlook_scores_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      market_comps: {
        Row: {
          comp_address: string | null
          comp_sale_date: string | null
          comp_sale_price: number | null
          comp_sqft: number | null
          data_license_status: string | null
          distance_miles: number | null
          id: string
          property_id: string | null
          source: string | null
          source_url: string | null
        }
        Insert: {
          comp_address?: string | null
          comp_sale_date?: string | null
          comp_sale_price?: number | null
          comp_sqft?: number | null
          data_license_status?: string | null
          distance_miles?: number | null
          id?: string
          property_id?: string | null
          source?: string | null
          source_url?: string | null
        }
        Update: {
          comp_address?: string | null
          comp_sale_date?: string | null
          comp_sale_price?: number | null
          comp_sqft?: number | null
          data_license_status?: string | null
          distance_miles?: number | null
          id?: string
          property_id?: string | null
          source?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_comps_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      market_estimates: {
        Row: {
          data_license_status: string | null
          estimate_date: string | null
          estimate_type: string | null
          estimate_value: number | null
          id: string
          property_id: string | null
          source: string | null
        }
        Insert: {
          data_license_status?: string | null
          estimate_date?: string | null
          estimate_type?: string | null
          estimate_value?: number | null
          id?: string
          property_id?: string | null
          source?: string | null
        }
        Update: {
          data_license_status?: string | null
          estimate_date?: string | null
          estimate_type?: string | null
          estimate_value?: number | null
          id?: string
          property_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_estimates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      mortgage_lien_records: {
        Row: {
          amount: number | null
          created_at: string | null
          data_license_status: string | null
          id: string
          lender_or_claimant: string | null
          property_id: string | null
          record_type: string | null
          recorded_date: string | null
          recording_number: string | null
          released_date: string | null
          source_url: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          data_license_status?: string | null
          id?: string
          lender_or_claimant?: string | null
          property_id?: string | null
          record_type?: string | null
          recorded_date?: string | null
          recording_number?: string | null
          released_date?: string | null
          source_url?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          data_license_status?: string | null
          id?: string
          lender_or_claimant?: string | null
          property_id?: string | null
          record_type?: string | null
          recorded_date?: string | null
          recording_number?: string | null
          released_date?: string | null
          source_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mortgage_lien_records_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhood_trends: {
        Row: {
          area_id: string
          id: string
          median_days_on_market: number | null
          median_sale_price: number | null
          period: string
          price_change_pct: number | null
          source_url: string | null
        }
        Insert: {
          area_id: string
          id?: string
          median_days_on_market?: number | null
          median_sale_price?: number | null
          period: string
          price_change_pct?: number | null
          source_url?: string | null
        }
        Update: {
          area_id?: string
          id?: string
          median_days_on_market?: number | null
          median_sale_price?: number | null
          period?: string
          price_change_pct?: number | null
          source_url?: string | null
        }
        Relationships: []
      }
      ownership_history: {
        Row: {
          data_license_status: string | null
          document_type: string | null
          id: string
          owner_name: string | null
          owner_type: string | null
          property_id: string | null
          recorder_doc_number: string | null
          sale_price: number | null
          source_url: string | null
          transfer_date: string | null
        }
        Insert: {
          data_license_status?: string | null
          document_type?: string | null
          id?: string
          owner_name?: string | null
          owner_type?: string | null
          property_id?: string | null
          recorder_doc_number?: string | null
          sale_price?: number | null
          source_url?: string | null
          transfer_date?: string | null
        }
        Update: {
          data_license_status?: string | null
          document_type?: string | null
          id?: string
          owner_name?: string | null
          owner_type?: string | null
          property_id?: string | null
          recorder_doc_number?: string | null
          sale_price?: number | null
          source_url?: string | null
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
      permit_contractors: {
        Row: {
          contractor_id: string
          permit_id: string
          role: string | null
        }
        Insert: {
          contractor_id: string
          permit_id: string
          role?: string | null
        }
        Update: {
          contractor_id?: string
          permit_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_contractors_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permit_contractors_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_professionals: {
        Row: {
          permit_id: string
          professional_id: string
          role: string | null
        }
        Insert: {
          permit_id: string
          professional_id: string
          role?: string | null
        }
        Update: {
          permit_id?: string
          professional_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permit_professionals_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permit_professionals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      permits: {
        Row: {
          applicant_name: string | null
          description: string | null
          finaled_date: string | null
          id: string
          issued_date: string | null
          permit_number: string | null
          permit_type: string | null
          property_id: string | null
          source_url: string | null
          status: string | null
          valuation: number | null
        }
        Insert: {
          applicant_name?: string | null
          description?: string | null
          finaled_date?: string | null
          id?: string
          issued_date?: string | null
          permit_number?: string | null
          permit_type?: string | null
          property_id?: string | null
          source_url?: string | null
          status?: string | null
          valuation?: number | null
        }
        Update: {
          applicant_name?: string | null
          description?: string | null
          finaled_date?: string | null
          id?: string
          issued_date?: string | null
          permit_number?: string | null
          permit_type?: string | null
          property_id?: string | null
          source_url?: string | null
          status?: string | null
          valuation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "permits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_ai_observations: {
        Row: {
          confidence_score: number | null
          created_at: string
          created_by: string | null
          disclaimer: string
          id: string
          is_certified: boolean
          model: string
          observation_type: string
          prompt: string | null
          property_id: string
          response_json: Json
          response_text: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          disclaimer: string
          id?: string
          is_certified?: boolean
          model: string
          observation_type: string
          prompt?: string | null
          property_id: string
          response_json?: Json
          response_text?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          disclaimer?: string
          id?: string
          is_certified?: boolean
          model?: string
          observation_type?: string
          prompt?: string | null
          property_id?: string
          response_json?: Json
          response_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_ai_observations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_audit_log: {
        Row: {
          action: string
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          payload: Json
          property_id: string | null
        }
        Insert: {
          action: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          payload?: Json
          property_id?: string | null
        }
        Update: {
          action?: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          payload?: Json
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_audit_log_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_certificates: {
        Row: {
          cert_type: string
          created_at: string
          document_id: string | null
          expires_at: string | null
          id: string
          issued_at: string | null
          issued_by: string | null
          metadata: Json
          project_id: string | null
          property_id: string
          updated_at: string
        }
        Insert: {
          cert_type: string
          created_at?: string
          document_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          metadata?: Json
          project_id?: string | null
          property_id: string
          updated_at?: string
        }
        Update: {
          cert_type?: string
          created_at?: string
          document_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          metadata?: Json
          project_id?: string | null
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_certificates_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "platform_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_certificates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "platform_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_certificates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_customer_acknowledgments: {
        Row: {
          ack_type: string
          created_at: string
          document_id: string | null
          id: string
          ip_address: unknown
          metadata: Json
          property_id: string
          signed_at: string
          signed_name: string | null
          user_id: string | null
        }
        Insert: {
          ack_type: string
          created_at?: string
          document_id?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json
          property_id: string
          signed_at?: string
          signed_name?: string | null
          user_id?: string | null
        }
        Update: {
          ack_type?: string
          created_at?: string
          document_id?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json
          property_id?: string
          signed_at?: string
          signed_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_customer_acknowledgments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "platform_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_customer_acknowledgments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_documents: {
        Row: {
          created_at: string
          description: string | null
          doc_type: string
          file_size_bytes: number | null
          id: string
          metadata: Json
          mime_type: string | null
          property_id: string
          source: string
          storage_path: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          doc_type: string
          file_size_bytes?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          property_id: string
          source?: string
          storage_path: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          doc_type?: string
          file_size_bytes?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          property_id?: string
          source?: string
          storage_path?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_media_assets: {
        Row: {
          asset_type: string
          caption: string | null
          created_at: string
          id: string
          metadata: Json
          property_id: string
          storage_path: string
          taken_at: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          asset_type: string
          caption?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          property_id: string
          storage_path: string
          taken_at?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          asset_type?: string
          caption?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          property_id?: string
          storage_path?: string
          taken_at?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_media_assets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_permit_submissions: {
        Row: {
          created_at: string
          external_reference: string | null
          id: string
          jurisdiction: string | null
          payload: Json
          permit_type: string
          project_id: string | null
          property_id: string
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_reference?: string | null
          id?: string
          jurisdiction?: string | null
          payload?: Json
          permit_type: string
          project_id?: string | null
          property_id: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_reference?: string | null
          id?: string
          jurisdiction?: string | null
          payload?: Json
          permit_type?: string
          project_id?: string | null
          property_id?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_permit_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "platform_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_permit_submissions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "platform_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_projects: {
        Row: {
          actual_completion_date: string | null
          budget_cents: number | null
          contractor_professional_id: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json
          owner_user_id: string | null
          project_type: string
          property_id: string
          start_date: string | null
          status: string
          target_completion_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          budget_cents?: number | null
          contractor_professional_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          owner_user_id?: string | null
          project_type: string
          property_id: string
          start_date?: string | null
          status?: string
          target_completion_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          budget_cents?: number | null
          contractor_professional_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          owner_user_id?: string | null
          project_type?: string
          property_id?: string
          start_date?: string | null
          status?: string
          target_completion_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_projects_contractor_professional_id_fkey"
            columns: ["contractor_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_projects_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_property_timeline_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          metadata: Json
          property_id: string
          related_entity_id: string | null
          related_entity_type: string | null
          source: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          metadata?: Json
          property_id: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          source?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          metadata?: Json
          property_id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          source?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_property_timeline_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_badge_history: {
        Row: {
          changed_at: string | null
          id: string
          new_badge: string | null
          previous_badge: string | null
          professional_id: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string | null
          id?: string
          new_badge?: string | null
          previous_badge?: string | null
          professional_id?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string | null
          id?: string
          new_badge?: string | null
          previous_badge?: string | null
          professional_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_badge_history_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          bbb_accredited: boolean | null
          bbb_rating: string | null
          bond_status: string | null
          business_registration_number: string | null
          business_registration_status: string | null
          company_name: string | null
          complaints_count: number | null
          complaints_detail: Json | null
          created_at: string | null
          expiration_date: string | null
          id: string
          identity_mismatch: boolean | null
          insurance_status: string | null
          issuing_state: string | null
          issuing_state_agency: string | null
          license_number: string | null
          license_status: string | null
          license_type: string | null
          major_complaint: boolean | null
          nmls_id: string | null
          professional_category: string | null
          professional_name: string | null
          source_link: string | null
          trade_type: string | null
          updated_at: string | null
          verification_badge: string | null
          verification_score: number | null
          verified_date: string | null
          workers_comp_status: string | null
        }
        Insert: {
          bbb_accredited?: boolean | null
          bbb_rating?: string | null
          bond_status?: string | null
          business_registration_number?: string | null
          business_registration_status?: string | null
          company_name?: string | null
          complaints_count?: number | null
          complaints_detail?: Json | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          identity_mismatch?: boolean | null
          insurance_status?: string | null
          issuing_state?: string | null
          issuing_state_agency?: string | null
          license_number?: string | null
          license_status?: string | null
          license_type?: string | null
          major_complaint?: boolean | null
          nmls_id?: string | null
          professional_category?: string | null
          professional_name?: string | null
          source_link?: string | null
          trade_type?: string | null
          updated_at?: string | null
          verification_badge?: string | null
          verification_score?: number | null
          verified_date?: string | null
          workers_comp_status?: string | null
        }
        Update: {
          bbb_accredited?: boolean | null
          bbb_rating?: string | null
          bond_status?: string | null
          business_registration_number?: string | null
          business_registration_status?: string | null
          company_name?: string | null
          complaints_count?: number | null
          complaints_detail?: Json | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          identity_mismatch?: boolean | null
          insurance_status?: string | null
          issuing_state?: string | null
          issuing_state_agency?: string | null
          license_number?: string | null
          license_status?: string | null
          license_type?: string | null
          major_complaint?: boolean | null
          nmls_id?: string | null
          professional_category?: string | null
          professional_name?: string | null
          source_link?: string | null
          trade_type?: string | null
          updated_at?: string | null
          verification_badge?: string | null
          verification_score?: number | null
          verified_date?: string | null
          workers_comp_status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          stripe_customer_id: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string | null
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
          county: string | null
          created_at: string
          created_by: string | null
          fema_flood_zone: string | null
          full_address: string | null
          gis_map_url: string | null
          historic_district_status: string | null
          id: string
          last_verified_at: string | null
          latitude: number | null
          legal_description: string | null
          longitude: number | null
          lot_size_acres: number | null
          lot_size_sqft: number | null
          parcel_number: string | null
          property_type: string | null
          square_feet: number | null
          square_footage: number | null
          state: string
          street_address: string | null
          unit: string | null
          updated_at: string
          year_built: number | null
          zip: string
          zoning_code: string | null
          zoning_description: string | null
        }
        Insert: {
          address_line: string
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          claimed_by?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          fema_flood_zone?: string | null
          full_address?: string | null
          gis_map_url?: string | null
          historic_district_status?: string | null
          id?: string
          last_verified_at?: string | null
          latitude?: number | null
          legal_description?: string | null
          longitude?: number | null
          lot_size_acres?: number | null
          lot_size_sqft?: number | null
          parcel_number?: string | null
          property_type?: string | null
          square_feet?: number | null
          square_footage?: number | null
          state: string
          street_address?: string | null
          unit?: string | null
          updated_at?: string
          year_built?: number | null
          zip: string
          zoning_code?: string | null
          zoning_description?: string | null
        }
        Update: {
          address_line?: string
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          claimed_by?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          fema_flood_zone?: string | null
          full_address?: string | null
          gis_map_url?: string | null
          historic_district_status?: string | null
          id?: string
          last_verified_at?: string | null
          latitude?: number | null
          legal_description?: string | null
          longitude?: number | null
          lot_size_acres?: number | null
          lot_size_sqft?: number | null
          parcel_number?: string | null
          property_type?: string | null
          square_feet?: number | null
          square_footage?: number | null
          state?: string
          street_address?: string | null
          unit?: string | null
          updated_at?: string
          year_built?: number | null
          zip?: string
          zoning_code?: string | null
          zoning_description?: string | null
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
      property_jurisdictions: {
        Row: {
          congressional_district: string | null
          council_district: string | null
          id: string
          property_id: string | null
          state_house_district: string | null
          state_senate_district: string | null
        }
        Insert: {
          congressional_district?: string | null
          council_district?: string | null
          id?: string
          property_id?: string | null
          state_house_district?: string | null
          state_senate_district?: string | null
        }
        Update: {
          congressional_district?: string | null
          council_district?: string | null
          id?: string
          property_id?: string | null
          state_house_district?: string | null
          state_senate_district?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_jurisdictions_property_id_fkey"
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
      property_tax_records: {
        Row: {
          assessed_value: number | null
          created_at: string | null
          due_date: string | null
          id: string
          market_value: number | null
          millage_rate: number | null
          paid_status: string | null
          property_id: string | null
          source_url: string | null
          tax_amount: number | null
          tax_year: number
          taxable_value: number | null
        }
        Insert: {
          assessed_value?: number | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          market_value?: number | null
          millage_rate?: number | null
          paid_status?: string | null
          property_id?: string | null
          source_url?: string | null
          tax_amount?: number | null
          tax_year: number
          taxable_value?: number | null
        }
        Update: {
          assessed_value?: number | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          market_value?: number | null
          millage_rate?: number | null
          paid_status?: string | null
          property_id?: string | null
          source_url?: string | null
          tax_amount?: number | null
          tax_year?: number
          taxable_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_tax_records_property_id_fkey"
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
      regional_home_coach_query_log: {
        Row: {
          created_at: string
          disclaimer: string
          id: string
          is_certified: boolean
          model: string
          prompt: string
          property_id: string | null
          response_json: Json
          response_text: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          disclaimer: string
          id?: string
          is_certified?: boolean
          model: string
          prompt: string
          property_id?: string | null
          response_json?: Json
          response_text?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          disclaimer?: string
          id?: string
          is_certified?: boolean
          model?: string
          prompt?: string
          property_id?: string | null
          response_json?: Json
          response_text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regional_home_coach_query_log_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_home_system_topics: {
        Row: {
          body_markdown: string | null
          category: string
          created_at: string
          id: string
          metadata: Json
          region_scope: string
          summary: string | null
          title: string
          topic_key: string
          updated_at: string
        }
        Insert: {
          body_markdown?: string | null
          category: string
          created_at?: string
          id?: string
          metadata?: Json
          region_scope?: string
          summary?: string | null
          title: string
          topic_key: string
          updated_at?: string
        }
        Update: {
          body_markdown?: string | null
          category?: string
          created_at?: string
          id?: string
          metadata?: Json
          region_scope?: string
          summary?: string | null
          title?: string
          topic_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      regional_incentives: {
        Row: {
          amount_text: string | null
          authority_level: string
          category: string
          created_at: string
          eligibility_summary: string | null
          ends_on: string | null
          id: string
          jurisdiction: string | null
          metadata: Json
          program_key: string
          starts_on: string | null
          state_code: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          amount_text?: string | null
          authority_level: string
          category: string
          created_at?: string
          eligibility_summary?: string | null
          ends_on?: string | null
          id?: string
          jurisdiction?: string | null
          metadata?: Json
          program_key: string
          starts_on?: string | null
          state_code?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          amount_text?: string | null
          authority_level?: string
          category?: string
          created_at?: string
          eligibility_summary?: string | null
          ends_on?: string | null
          id?: string
          jurisdiction?: string | null
          metadata?: Json
          program_key?: string
          starts_on?: string | null
          state_code?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      regional_insurance_guidance: {
        Row: {
          authority: string | null
          body_markdown: string | null
          created_at: string
          id: string
          last_reviewed: string | null
          metadata: Json
          state_code: string
          summary: string | null
          topic: string
          updated_at: string
        }
        Insert: {
          authority?: string | null
          body_markdown?: string | null
          created_at?: string
          id?: string
          last_reviewed?: string | null
          metadata?: Json
          state_code: string
          summary?: string | null
          topic: string
          updated_at?: string
        }
        Update: {
          authority?: string | null
          body_markdown?: string | null
          created_at?: string
          id?: string
          last_reviewed?: string | null
          metadata?: Json
          state_code?: string
          summary?: string | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      regional_property_profile: {
        Row: {
          classified_at: string
          climate_zone: string | null
          county_fips: string | null
          flood_risk_level: string | null
          hail_risk_level: string | null
          id: string
          metadata: Json
          property_id: string
          region_classification: string | null
          state_code: string | null
          updated_at: string
          wildfire_risk_level: string | null
          wind_risk_level: string | null
        }
        Insert: {
          classified_at?: string
          climate_zone?: string | null
          county_fips?: string | null
          flood_risk_level?: string | null
          hail_risk_level?: string | null
          id?: string
          metadata?: Json
          property_id: string
          region_classification?: string | null
          state_code?: string | null
          updated_at?: string
          wildfire_risk_level?: string | null
          wind_risk_level?: string | null
        }
        Update: {
          classified_at?: string
          climate_zone?: string | null
          county_fips?: string | null
          flood_risk_level?: string | null
          hail_risk_level?: string | null
          id?: string
          metadata?: Json
          property_id?: string
          region_classification?: string | null
          state_code?: string | null
          updated_at?: string
          wildfire_risk_level?: string | null
          wind_risk_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regional_property_profile_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_property_systems: {
        Row: {
          contractor_professional_id: string | null
          created_at: string
          id: string
          install_date: string | null
          manufacturer: string | null
          metadata: Json
          model: string | null
          notes: string | null
          permit_id: string | null
          property_id: string
          status: string
          system_type: string
          updated_at: string
          warranty_expires: string | null
        }
        Insert: {
          contractor_professional_id?: string | null
          created_at?: string
          id?: string
          install_date?: string | null
          manufacturer?: string | null
          metadata?: Json
          model?: string | null
          notes?: string | null
          permit_id?: string | null
          property_id: string
          status?: string
          system_type: string
          updated_at?: string
          warranty_expires?: string | null
        }
        Update: {
          contractor_professional_id?: string | null
          created_at?: string
          id?: string
          install_date?: string | null
          manufacturer?: string | null
          metadata?: Json
          model?: string | null
          notes?: string | null
          permit_id?: string | null
          property_id?: string
          status?: string
          system_type?: string
          updated_at?: string
          warranty_expires?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regional_property_systems_contractor_professional_id_fkey"
            columns: ["contractor_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regional_property_systems_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regional_property_systems_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_solar_systems: {
        Row: {
          battery_capacity_kwh: number | null
          created_at: string
          estimated_annual_kwh: number | null
          financing_provider: string | null
          id: string
          inverter_type: string | null
          metadata: Json
          ownership_type: string | null
          panel_count: number | null
          ppa_term_years: number | null
          property_id: string
          property_system_id: string
          system_capacity_kw: number | null
          updated_at: string
        }
        Insert: {
          battery_capacity_kwh?: number | null
          created_at?: string
          estimated_annual_kwh?: number | null
          financing_provider?: string | null
          id?: string
          inverter_type?: string | null
          metadata?: Json
          ownership_type?: string | null
          panel_count?: number | null
          ppa_term_years?: number | null
          property_id: string
          property_system_id: string
          system_capacity_kw?: number | null
          updated_at?: string
        }
        Update: {
          battery_capacity_kwh?: number | null
          created_at?: string
          estimated_annual_kwh?: number | null
          financing_provider?: string | null
          id?: string
          inverter_type?: string | null
          metadata?: Json
          ownership_type?: string | null
          panel_count?: number | null
          ppa_term_years?: number | null
          property_id?: string
          property_system_id?: string
          system_capacity_kw?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regional_solar_systems_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regional_solar_systems_property_system_id_fkey"
            columns: ["property_system_id"]
            isOneToOne: true
            referencedRelation: "regional_property_systems"
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
      safety_districts: {
        Row: {
          distance_miles: number | null
          district_type: string | null
          id: string
          phone: string | null
          property_id: string | null
          station_address: string | null
          station_name: string | null
        }
        Insert: {
          distance_miles?: number | null
          district_type?: string | null
          id?: string
          phone?: string | null
          property_id?: string | null
          station_address?: string | null
          station_name?: string | null
        }
        Update: {
          distance_miles?: number | null
          district_type?: string | null
          id?: string
          phone?: string | null
          property_id?: string | null
          station_address?: string | null
          station_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_districts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      school_assignments: {
        Row: {
          id: string
          property_id: string | null
          school_id: string | null
          school_level: string | null
        }
        Insert: {
          id?: string
          property_id?: string | null
          school_id?: string | null
          school_level?: string | null
        }
        Update: {
          id?: string
          property_id?: string | null
          school_id?: string | null
          school_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_districts: {
        Row: {
          id: string
          name: string
          phone: string | null
          website: string | null
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          website?: string | null
        }
        Relationships: []
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
      special_taxing_districts: {
        Row: {
          annual_fee: number | null
          district_name: string | null
          district_type: string | null
          id: string
          property_id: string | null
        }
        Insert: {
          annual_fee?: number | null
          district_name?: string | null
          district_type?: string | null
          id?: string
          property_id?: string | null
        }
        Update: {
          annual_fee?: number | null
          district_name?: string | null
          district_type?: string | null
          id?: string
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_taxing_districts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          plan: string | null
          price_id: string | null
          product_id: string | null
          renews_at: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          plan?: string | null
          price_id?: string | null
          product_id?: string | null
          renews_at?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          plan?: string | null
          price_id?: string | null
          product_id?: string | null
          renews_at?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tax_exemptions: {
        Row: {
          amount: number | null
          exemption_type: string | null
          id: string
          property_id: string | null
          tax_year: number | null
        }
        Insert: {
          amount?: number | null
          exemption_type?: string | null
          id?: string
          property_id?: string | null
          tax_year?: number | null
        }
        Update: {
          amount?: number | null
          exemption_type?: string | null
          id?: string
          property_id?: string | null
          tax_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_exemptions_property_id_fkey"
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
      voter_info: {
        Row: {
          election_authority_contact: string | null
          election_authority_name: string | null
          id: string
          polling_place_address: string | null
          polling_place_name: string | null
          property_id: string | null
          registration_notes: string | null
          source_url: string | null
        }
        Insert: {
          election_authority_contact?: string | null
          election_authority_name?: string | null
          id?: string
          polling_place_address?: string | null
          polling_place_name?: string | null
          property_id?: string | null
          registration_notes?: string | null
          source_url?: string | null
        }
        Update: {
          election_authority_contact?: string | null
          election_authority_name?: string | null
          id?: string
          polling_place_address?: string | null
          polling_place_name?: string | null
          property_id?: string | null
          registration_notes?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voter_info_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      weather_events: {
        Row: {
          event_date: string | null
          event_type: string | null
          id: string
          property_id: string | null
          severity: string | null
          source: string | null
          source_url: string | null
        }
        Insert: {
          event_date?: string | null
          event_type?: string | null
          id?: string
          property_id?: string | null
          severity?: string | null
          source?: string | null
          source_url?: string | null
        }
        Update: {
          event_date?: string | null
          event_type?: string | null
          id?: string
          property_id?: string | null
          severity?: string | null
          source?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      work_history_records: {
        Row: {
          created_at: string | null
          id: string
          insurance_verified_at_time: boolean | null
          license_status_at_time: string | null
          license_verified: boolean | null
          permit_id: string | null
          professional_id: string | null
          property_id: string | null
          risk_note_override: string | null
          source_url: string | null
          work_date: string | null
          work_performed: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          insurance_verified_at_time?: boolean | null
          license_status_at_time?: string | null
          license_verified?: boolean | null
          permit_id?: string | null
          professional_id?: string | null
          property_id?: string | null
          risk_note_override?: string | null
          source_url?: string | null
          work_date?: string | null
          work_performed: string
        }
        Update: {
          created_at?: string | null
          id?: string
          insurance_verified_at_time?: boolean | null
          license_status_at_time?: string | null
          license_verified?: boolean | null
          permit_id?: string | null
          professional_id?: string | null
          property_id?: string | null
          risk_note_override?: string | null
          source_url?: string | null
          work_date?: string | null
          work_performed?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_history_records_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_history_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_history_records_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_env_hail_events: {
        Row: {
          created_at: string | null
          description: string | null
          distance_miles: number | null
          event_date: string | null
          event_type: string | null
          external_id: string | null
          id: string | null
          magnitude: number | null
          magnitude_unit: string | null
          property_id: string | null
          raw: Json | null
          severity: string | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          distance_miles?: number | null
          event_date?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string | null
          magnitude?: number | null
          magnitude_unit?: string | null
          property_id?: string | null
          raw?: Json | null
          severity?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          distance_miles?: number | null
          event_date?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string | null
          magnitude?: number | null
          magnitude_unit?: string | null
          property_id?: string | null
          raw?: Json | null
          severity?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "env_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      v_env_tornado_events: {
        Row: {
          created_at: string | null
          description: string | null
          distance_miles: number | null
          event_date: string | null
          event_type: string | null
          external_id: string | null
          id: string | null
          magnitude: number | null
          magnitude_unit: string | null
          property_id: string | null
          raw: Json | null
          severity: string | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          distance_miles?: number | null
          event_date?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string | null
          magnitude?: number | null
          magnitude_unit?: string | null
          property_id?: string | null
          raw?: Json | null
          severity?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          distance_miles?: number | null
          event_date?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string | null
          magnitude?: number | null
          magnitude_unit?: string | null
          property_id?: string | null
          raw?: Json | null
          severity?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "env_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      v_env_wind_events: {
        Row: {
          created_at: string | null
          description: string | null
          distance_miles: number | null
          event_date: string | null
          event_type: string | null
          external_id: string | null
          id: string | null
          magnitude: number | null
          magnitude_unit: string | null
          property_id: string | null
          raw: Json | null
          severity: string | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          distance_miles?: number | null
          event_date?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string | null
          magnitude?: number | null
          magnitude_unit?: string | null
          property_id?: string | null
          raw?: Json | null
          severity?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          distance_miles?: number | null
          event_date?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string | null
          magnitude?: number | null
          magnitude_unit?: string | null
          property_id?: string | null
          raw?: Json | null
          severity?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "env_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      v_env_winter_events: {
        Row: {
          created_at: string | null
          description: string | null
          distance_miles: number | null
          event_date: string | null
          event_type: string | null
          external_id: string | null
          id: string | null
          magnitude: number | null
          magnitude_unit: string | null
          property_id: string | null
          raw: Json | null
          severity: string | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          distance_miles?: number | null
          event_date?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string | null
          magnitude?: number | null
          magnitude_unit?: string | null
          property_id?: string | null
          raw?: Json | null
          severity?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          distance_miles?: number | null
          event_date?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string | null
          magnitude?: number | null
          magnitude_unit?: string | null
          property_id?: string | null
          raw?: Json | null
          severity?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "env_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      work_history_with_current_status: {
        Row: {
          company_name: string | null
          id: string | null
          insurance_status_today: string | null
          insurance_verified_at_time: boolean | null
          license_status_at_time: string | null
          license_status_today: string | null
          license_verified: boolean | null
          permit_id: string | null
          permit_number: string | null
          professional_badge_today: string | null
          professional_id: string | null
          professional_name: string | null
          property_id: string | null
          risk_note: string | null
          source_url: string | null
          work_date: string | null
          work_performed: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_history_records_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_history_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_history_records_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_property_owner: {
        Args: { _property_id: string; _user_id: string }
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
