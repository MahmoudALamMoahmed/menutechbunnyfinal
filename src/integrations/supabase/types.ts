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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      branch_payment_methods: {
        Row: {
          account_number: string
          branch_id: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          account_number: string
          branch_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          account_number?: string
          branch_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_payment_methods_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_staff: {
        Row: {
          branch_id: string
          created_at: string
          email: string
          id: string
          restaurant_id: string
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          email: string
          id?: string
          restaurant_id: string
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          email?: string
          id?: string
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_staff_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_staff_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "public_restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_staff_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          delivery_phone: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          order_mode: string | null
          phone: string | null
          restaurant_id: string
          updated_at: string
          whatsapp_phone: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          delivery_phone?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          order_mode?: string | null
          phone?: string | null
          restaurant_id: string
          updated_at?: string
          whatsapp_phone?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          delivery_phone?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_mode?: string | null
          phone?: string | null
          restaurant_id?: string
          updated_at?: string
          whatsapp_phone?: string | null
          working_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "public_restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          name: string
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
          restaurant_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "public_restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_leads: {
        Row: {
          created_at: string
          id: string
          message: string | null
          name: string
          notes: string | null
          phone: string
          restaurant_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          phone: string
          restaurant_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string
          restaurant_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_areas: {
        Row: {
          branch_id: string
          created_at: string
          delivery_price: number
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          delivery_price?: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          delivery_price?: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_areas_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      extras: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_available: boolean | null
          name: string
          price: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          name: string
          price?: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          name?: string
          price?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extras_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "public_restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extras_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_public_id: string | null
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_public_id?: string | null
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_public_id?: string | null
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "public_restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          branch_id: string | null
          created_at: string
          customer_address: string | null
          customer_name: string
          customer_phone: string
          delivery_area_id: string | null
          id: string
          is_confirmed: boolean | null
          items: Json
          notes: string | null
          order_source: string
          payment_method: string | null
          restaurant_id: string
          status: string | null
          total_price: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name: string
          customer_phone: string
          delivery_area_id?: string | null
          id?: string
          is_confirmed?: boolean | null
          items: Json
          notes?: string | null
          order_source?: string
          payment_method?: string | null
          restaurant_id: string
          status?: string | null
          total_price: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_area_id?: string | null
          id?: string
          is_confirmed?: boolean | null
          items?: Json
          notes?: string | null
          order_source?: string
          payment_method?: string | null
          restaurant_id?: string
          status?: string | null
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_area_id_fkey"
            columns: ["delivery_area_id"]
            isOneToOne: false
            referencedRelation: "delivery_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "public_restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          display_order: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_branches: number | null
          max_categories: number | null
          max_extras: number | null
          max_items: number | null
          name: string
          name_ar: string
          price_monthly: number
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_branches?: number | null
          max_categories?: number | null
          max_extras?: number | null
          max_items?: number | null
          name: string
          name_ar: string
          price_monthly?: number
        }
        Update: {
          created_at?: string
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_branches?: number | null
          max_categories?: number | null
          max_extras?: number | null
          max_items?: number | null
          name?: string
          name_ar?: string
          price_monthly?: number
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string | null
          cover_image_public_id: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          logo_public_id: string | null
          logo_url: string | null
          name: string
          owner_id: string
          updated_at: string
          username: string
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          cover_image_public_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_public_id?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          updated_at?: string
          username: string
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          cover_image_public_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_public_id?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          updated_at?: string
          username?: string
          working_hours?: string | null
        }
        Relationships: []
      }
      sizes: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          menu_item_id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          menu_item_id: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          menu_item_id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sizes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          period_end: string | null
          period_start: string | null
          plan_id: string
          restaurant_id: string
          subscription_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          plan_id: string
          restaurant_id: string
          subscription_id?: string | null
          type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          plan_id?: string
          restaurant_id?: string
          subscription_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_transactions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "public_restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_transactions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          expires_at: string
          id: string
          plan_id: string
          restaurant_id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          expires_at: string
          id?: string
          plan_id: string
          restaurant_id: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          plan_id?: string
          restaurant_id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "public_restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          expires_at: string | null
          id: string
          kashier_order_id: string | null
          kashier_session_id: string | null
          payment_method: string | null
          status: string
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          expires_at?: string | null
          id?: string
          kashier_order_id?: string | null
          kashier_session_id?: string | null
          payment_method?: string | null
          status?: string
          type?: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          kashier_order_id?: string | null
          kashier_session_id?: string | null
          payment_method?: string | null
          status?: string
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "public_restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallets_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_restaurants: {
        Row: {
          address: string | null
          cover_image_public_id: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          facebook_url: string | null
          id: string | null
          instagram_url: string | null
          logo_public_id: string | null
          logo_url: string | null
          name: string | null
          updated_at: string | null
          username: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          cover_image_public_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          facebook_url?: string | null
          id?: string | null
          instagram_url?: string | null
          logo_public_id?: string | null
          logo_url?: string | null
          name?: string | null
          updated_at?: string | null
          username?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          cover_image_public_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          facebook_url?: string | null
          id?: string | null
          instagram_url?: string | null
          logo_public_id?: string | null
          logo_url?: string | null
          name?: string | null
          updated_at?: string | null
          username?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      adjust_wallet_balance: {
        Args: { p_amount: number; p_type: string; p_wallet_id: string }
        Returns: number
      }
      batch_update_display_order: {
        Args: { p_items: Json; p_table_name: string }
        Returns: undefined
      }
      expire_pending_transactions: { Args: never; Returns: number }
      get_analytics_summary: {
        Args: {
          p_branch_id?: string
          p_from?: string
          p_order_source?: string
          p_restaurant_id: string
          p_to?: string
        }
        Returns: Json
      }
      get_restaurant_limits: {
        Args: { p_restaurant_id: string }
        Returns: {
          auto_renew: boolean
          expires_at: string
          features: Json
          is_subscribed: boolean
          max_branches: number
          max_categories: number
          max_extras: number
          max_items: number
          plan_id: string
          plan_name: string
          plan_name_ar: string
        }[]
      }
      get_staff_branch_id: { Args: { _user_id: string }; Returns: string }
      get_staff_restaurant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_branch_staff: { Args: { _user_id: string }; Returns: boolean }
      process_failed_payment: {
        Args: { p_kashier_order_id: string }
        Returns: string
      }
      process_successful_payment: {
        Args: {
          p_amount: number
          p_kashier_order_id: string
          p_payment_method?: string
        }
        Returns: string
      }
      subscribe_to_plan: {
        Args: {
          p_auto_renew?: boolean
          p_plan_id: string
          p_restaurant_id: string
        }
        Returns: string
      }
      toggle_auto_renew: {
        Args: { p_auto_renew: boolean; p_restaurant_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "super_admin" | "sales"
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
      app_role: ["super_admin", "sales"],
    },
  },
} as const
