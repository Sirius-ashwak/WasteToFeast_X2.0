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
      users: {
        Row: {
          id: string
          username: string
          role: 'user' | 'restaurant_admin'
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          role?: 'user' | 'restaurant_admin'
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          role?: 'user' | 'restaurant_admin'
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      restaurants: {
        Row: {
          id: string
          name: string
          address: string
          latitude: number
          longitude: number
          contact_phone: string | null
          contact_email: string | null
          description: string | null
          restaurant_admin_id: string
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          latitude: number
          longitude: number
          contact_phone?: string | null
          contact_email?: string | null
          description?: string | null
          restaurant_admin_id: string
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          latitude?: number
          longitude?: number
          contact_phone?: string | null
          contact_email?: string | null
          description?: string | null
          restaurant_admin_id?: string
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      food_listings: {
        Row: {
          id: string
          restaurant_id: string
          food_item: string
          description: string | null
          quantity: string
          pickup_start_time: string
          pickup_end_time: string
          is_claimed: boolean
          claimed_by_user_id: string | null
          claimed_at: string | null
          dietary_info: string[] | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          food_item: string
          description?: string | null
          quantity: string
          pickup_start_time: string
          pickup_end_time: string
          is_claimed?: boolean
          claimed_by_user_id?: string | null
          claimed_at?: string | null
          dietary_info?: string[] | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          food_item?: string
          description?: string | null
          quantity?: string
          pickup_start_time?: string
          pickup_end_time?: string
          is_claimed?: boolean
          claimed_by_user_id?: string | null
          claimed_at?: string | null
          dietary_info?: string[] | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      claims: {
        Row: {
          id: string
          food_listing_id: string
          user_id: string
          claimed_at: string
          pickup_completed: boolean
          pickup_completed_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          food_listing_id: string
          user_id: string
          claimed_at?: string
          pickup_completed?: boolean
          pickup_completed_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          food_listing_id?: string
          user_id?: string
          claimed_at?: string
          pickup_completed?: boolean
          pickup_completed_at?: string | null
          notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'user' | 'restaurant_admin'
    }
  }
}