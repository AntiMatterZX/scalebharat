export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          profile_picture: string | null
          is_verified: boolean
          razorpay_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          profile_picture?: string | null
          is_verified?: boolean
          razorpay_customer_id?: string | null
        }
        Update: {
          email?: string
          first_name?: string
          last_name?: string
          profile_picture?: string | null
          is_verified?: boolean
          razorpay_customer_id?: string | null
          updated_at?: string
        }
      }
      startups: {
        Row: {
          id: string
          user_id: string
          company_name: string
          slug: string // Added slug
          tagline: string | null
          description: string | null
          logo: string | null
          website: string | null
          founded_year: number | null
          stage: "idea" | "prototype" | "mvp" | "early-stage" | "growth" | "expansion"
          industry: string[]
          business_model: "b2b" | "b2c" | "b2b2c" | "marketplace" | "saas" | "other"
          total_raised: number
          current_round: string | null
          target_amount: number | null
          valuation: number | null
          previous_investors: string[] | null
          revenue: number | null
          users_count: number | null
          growth_rate: number | null
          burn_rate: number | null
          is_verified: boolean
          is_featured: boolean
          status: "draft" | "pending_approval" | "published" | "suspended"
          views: number
          upvote_count: number
          created_at: string
          updated_at: string
          equity_percentage_offered?: number | null
          planned_use_of_funds?: string[] | null
          fundraising_timeline_months?: number | null
        }
        Insert: {
          user_id: string
          company_name: string
          slug: string // Added slug
          stage: "idea" | "prototype" | "mvp" | "early-stage" | "growth" | "expansion"
          industry: string[]
          business_model: "b2b" | "b2c" | "b2b2c" | "marketplace" | "saas" | "other"
          tagline?: string | null
          description?: string | null
          logo?: string | null
          website?: string | null
          founded_year?: number | null
          total_raised?: number
          current_round?: string | null
          target_amount?: number | null
          valuation?: number | null
          previous_investors?: string[] | null
          revenue?: number | null
          users_count?: number | null
          growth_rate?: number | null
          burn_rate?: number | null
          status?: "draft" | "pending_approval" | "published" | "suspended"
          upvote_count?: number
          equity_percentage_offered?: number | null
          planned_use_of_funds?: string[] | null
          fundraising_timeline_months?: number | null
        }
        Update: {
          company_name?: string
          slug?: string // Added slug
          tagline?: string | null
          description?: string | null
          logo?: string | null
          website?: string | null
          founded_year?: number | null
          stage?: "idea" | "prototype" | "mvp" | "early-stage" | "growth" | "expansion"
          industry?: string[]
          business_model?: "b2b" | "b2c" | "b2b2c" | "marketplace" | "saas" | "other"
          total_raised?: number
          current_round?: string | null
          target_amount?: number | null
          valuation?: number | null
          previous_investors?: string[] | null
          revenue?: number | null
          users_count?: number | null
          growth_rate?: number | null
          burn_rate?: number | null
          status?: "draft" | "pending_approval" | "published" | "suspended"
          is_verified?: boolean
          upvote_count?: number
          updated_at?: string
          equity_percentage_offered?: number | null
          planned_use_of_funds?: string[] | null
          fundraising_timeline_months?: number | null
        }
      }
      investors: {
        Row: {
          id: string
          user_id: string
          slug: string // Added slug
          type: "angel" | "vc" | "corporate" | "government" | "accelerator"
          firm_name: string | null
          bio: string | null
          website: string | null
          aum: number | null
          investment_stages: string[] | null
          investment_industries: string[] | null
          investment_geographies: string[] | null
          check_size_min: number | null
          check_size_max: number | null
          business_models: string[] | null
          linkedin: string | null
          twitter: string | null
          is_verified: boolean
          is_featured: boolean
          status: "active" | "inactive" | "suspended"
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          slug: string // Added slug
          type: "angel" | "vc" | "corporate" | "government" | "accelerator"
          firm_name?: string | null
          bio?: string | null
          website?: string | null
          aum?: number | null
          investment_stages?: string[] | null
          investment_industries?: string[] | null
          investment_geographies?: string[] | null
          check_size_min?: number | null
          check_size_max?: number | null
          business_models?: string[] | null
          linkedin?: string | null
          twitter?: string | null
        }
        Update: {
          slug?: string // Added slug
          type?: "angel" | "vc" | "corporate" | "government" | "accelerator"
          firm_name?: string | null
          bio?: string | null
          website?: string | null
          aum?: number | null
          investment_stages?: string[] | null
          investment_industries?: string[] | null
          investment_geographies?: string[] | null
          check_size_min?: number | null
          check_size_max?: number | null
          business_models?: string[] | null
          linkedin?: string | null
          twitter?: string | null
          status?: "active" | "inactive" | "suspended"
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          startup_id: string
          investor_id: string
          match_score: number
          status: "pending" | "interested" | "not-interested" | "meeting-scheduled" | "deal-closed"
          initiated_by: "system" | "startup" | "investor"
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          startup_id: string
          investor_id: string
          match_score: number
          initiated_by: "system" | "startup" | "investor"
          status?: "pending" | "interested" | "not-interested" | "meeting-scheduled" | "deal-closed"
          notes?: string | null
        }
        Update: {
          match_score?: number
          status?: "pending" | "interested" | "not-interested" | "meeting-scheduled" | "deal-closed"
          notes?: string | null
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          match_id: string
          content: string
          type: "text" | "file" | "meeting-request"
          is_read: boolean
          created_at: string
        }
        Insert: {
          sender_id: string
          receiver_id: string
          match_id: string
          content: string
          type?: "text" | "file" | "meeting-request"
          is_read?: boolean
        }
        Update: {
          content?: string
          type?: "text" | "file" | "meeting-request"
          is_read?: boolean
        }
      }
      meetings: {
        // Added meetings table definition
        Row: {
          id: string
          match_id: string
          organizer_id: string
          attendee_id: string
          title: string
          description: string | null
          scheduled_at: string
          duration_minutes: number
          type: string // 'video', 'phone', 'in-person'
          status: string // 'pending', 'confirmed', 'cancelled', 'completed'
          meeting_link: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          match_id: string
          organizer_id: string
          attendee_id: string
          title: string
          description?: string | null
          scheduled_at: string
          duration_minutes?: number
          type?: string
          status?: string
          meeting_link?: string | null
          notes?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          scheduled_at?: string
          duration_minutes?: number
          type?: string
          status?: string
          meeting_link?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          type: "page-view" | "profile-view" | "match-created" | "message-sent"
          user_id: string | null
          target_id: string | null
          metadata: Record<string, any>
          ip_address: string | null
          user_agent: string | null
          timestamp: string
        }
        Insert: {
          type: "page-view" | "profile-view" | "match-created" | "message-sent"
          user_id?: string | null
          target_id?: string | null
          metadata?: Record<string, any>
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          metadata?: Record<string, any>
        }
      }
      startup_documents: {
        Row: {
          id: string
          startup_id: string
          document_type: "pitch_deck" | "financials" | "other"
          file_name: string
          file_url: string
          file_path: string
          created_at: string
          updated_at: string
        }
        Insert: {
          startup_id: string
          document_type: "pitch_deck" | "financials" | "other"
          file_name: string
          file_url: string
          file_path: string
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          document_type?: "pitch_deck" | "financials" | "other"
          file_name?: string
          file_url?: string
          file_path?: string
          updated_at?: string
        }
      }
      startup_team_members: {
        Row: {
          id: string
          startup_id: string
          name: string
          role: string
          bio: string | null
          linkedin_url: string | null
          profile_picture_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          startup_id: string
          name: string
          role: string
          bio?: string | null
          linkedin_url?: string | null
          profile_picture_url?: string | null
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          role?: string
          bio?: string | null
          linkedin_url?: string | null
          profile_picture_url?: string | null
          updated_at?: string
        }
      }
      investor_wishlists: {
        Row: {
          id: string
          investor_id: string
          startup_id: string
          created_at: string
        }
        Insert: {
          investor_id: string
          startup_id: string
          id?: string
          created_at?: string
        }
      }
      startup_upvotes: {
        Row: {
          id: string
          user_id: string
          startup_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          startup_id: string
          id?: string
          created_at?: string
        }
      }
    }
  }
}
