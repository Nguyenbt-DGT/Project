export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bike_catalog: {
        Row: {
          bike: string
          brand: string
          id: string
          year_from: number
          year_to: number | null
        }
        Insert: {
          bike: string
          brand: string
          id?: string
          year_from: number
          year_to?: number | null
        }
        Update: {
          bike?: string
          brand?: string
          id?: string
          year_from?: number
          year_to?: number | null
        }
        Relationships: []
      }
      bike_part_intervals: {
        Row: {
          basis: string
          bike_catalog_id: string
          id: string
          interval_days: number | null
          interval_events: number | null
          interval_km: number | null
          type_key: string
        }
        Insert: {
          basis: string
          bike_catalog_id: string
          id?: string
          interval_days?: number | null
          interval_events?: number | null
          interval_km?: number | null
          type_key: string
        }
        Update: {
          basis?: string
          bike_catalog_id?: string
          id?: string
          interval_days?: number | null
          interval_events?: number | null
          interval_km?: number | null
          type_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "bike_part_intervals_bike_catalog_id_fkey"
            columns: ["bike_catalog_id"]
            isOneToOne: false
            referencedRelation: "bike_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bike_part_intervals_type_key_fkey"
            columns: ["type_key"]
            isOneToOne: false
            referencedRelation: "part_type_defaults"
            referencedColumns: ["type_key"]
          },
        ]
      }
      part_type_defaults: {
        Row: {
          basis: string
          interval_days: number | null
          interval_events: number | null
          interval_km: number | null
          name: string
          type_key: string
        }
        Insert: {
          basis: string
          interval_days?: number | null
          interval_events?: number | null
          interval_km?: number | null
          name: string
          type_key: string
        }
        Update: {
          basis?: string
          interval_days?: number | null
          interval_events?: number | null
          interval_km?: number | null
          name?: string
          type_key?: string
        }
        Relationships: []
      }
      service_events: {
        Row: {
          coupled_oil_filter_id: string | null
          coupled_oil_filter_prev_events: number | null
          created_at: string
          event_type: string
          id: string
          prev_events_elapsed: number
          prev_last_service_at: string | null
          prev_last_service_km: number | null
          service_item_id: string
          undone_at: string | null
          vehicle_id: string
        }
        Insert: {
          coupled_oil_filter_id?: string | null
          coupled_oil_filter_prev_events?: number | null
          created_at?: string
          event_type?: string
          id?: string
          prev_events_elapsed: number
          prev_last_service_at?: string | null
          prev_last_service_km?: number | null
          service_item_id: string
          undone_at?: string | null
          vehicle_id: string
        }
        Update: {
          coupled_oil_filter_id?: string | null
          coupled_oil_filter_prev_events?: number | null
          created_at?: string
          event_type?: string
          id?: string
          prev_events_elapsed?: number
          prev_last_service_at?: string | null
          prev_last_service_km?: number | null
          service_item_id?: string
          undone_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_events_coupled_oil_filter_id_fkey"
            columns: ["coupled_oil_filter_id"]
            isOneToOne: false
            referencedRelation: "service_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_events_service_item_id_fkey"
            columns: ["service_item_id"]
            isOneToOne: false
            referencedRelation: "service_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_items: {
        Row: {
          created_at: string
          events_elapsed: number
          id: string
          interval_days: number | null
          interval_events: number | null
          interval_km: number | null
          last_service_at: string | null
          last_service_km: number | null
          name: string
          price_cents: number | null
          type_key: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          events_elapsed?: number
          id?: string
          interval_days?: number | null
          interval_events?: number | null
          interval_km?: number | null
          last_service_at?: string | null
          last_service_km?: number | null
          name: string
          price_cents?: number | null
          type_key: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          events_elapsed?: number
          id?: string
          interval_days?: number | null
          interval_events?: number | null
          interval_km?: number | null
          last_service_at?: string | null
          last_service_km?: number | null
          name?: string
          price_cents?: number | null
          type_key?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_items_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      spend_entries: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          kind: string
          note: string | null
          part_type_key: string | null
          spent_at: string
          vehicle_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          part_type_key?: string | null
          spent_at?: string
          vehicle_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          part_type_key?: string | null
          spent_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spend_entries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          distance_applied_at: string | null
          distance_km: number
          id: string
          recorded_at: string
          vehicle_id: string
        }
        Insert: {
          distance_applied_at?: string | null
          distance_km: number
          id?: string
          recorded_at?: string
          vehicle_id: string
        }
        Update: {
          distance_applied_at?: string | null
          distance_km?: number
          id?: string
          recorded_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          created_at: string
          current_odometer_km: number
          id: string
          model: string | null
          name: string
          unit_preference: string
          user_id: string
        }
        Insert: {
          brand: string
          created_at?: string
          current_odometer_km?: number
          id?: string
          model?: string | null
          name: string
          unit_preference?: string
          user_id?: string
        }
        Update: {
          brand?: string
          created_at?: string
          current_odometer_km?: number
          id?: string
          model?: string | null
          name?: string
          unit_preference?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_trip_distance: {
        Args: { p_trip_id: string }
        Returns: {
          distance_applied_at: string | null
          distance_km: number
          id: string
          recorded_at: string
          vehicle_id: string
        }
        SetofOptions: {
          from: "*"
          to: "trips"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_service_done: {
        Args: { p_service_item_id: string }
        Returns: {
          created_at: string
          events_elapsed: number
          id: string
          interval_days: number | null
          interval_events: number | null
          interval_km: number | null
          last_service_at: string | null
          last_service_km: number | null
          name: string
          price_cents: number | null
          type_key: string
          vehicle_id: string
        }
        SetofOptions: {
          from: "*"
          to: "service_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      onboard_vehicle: {
        Args: {
          p_brand: string
          p_current_odometer_km: number
          p_name: string
          p_recently_changed: string[]
          p_unit: string
        }
        Returns: {
          brand: string
          created_at: string
          current_odometer_km: number
          id: string
          model: string | null
          name: string
          unit_preference: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "vehicles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_odometer: {
        Args: { p_value_km: number; p_vehicle_id: string }
        Returns: {
          brand: string
          created_at: string
          current_odometer_km: number
          id: string
          model: string | null
          name: string
          unit_preference: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "vehicles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      undo_last_service: {
        Args: { p_service_item_id: string }
        Returns: {
          created_at: string
          events_elapsed: number
          id: string
          interval_days: number | null
          interval_events: number | null
          interval_km: number | null
          last_service_at: string | null
          last_service_km: number | null
          name: string
          price_cents: number | null
          type_key: string
          vehicle_id: string
        }
        SetofOptions: {
          from: "*"
          to: "service_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

