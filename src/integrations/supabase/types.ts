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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          diff: Json | null
          entity: string
          entity_id: string
          id: number
          org_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          diff?: Json | null
          entity: string
          entity_id: string
          id?: never
          org_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          diff?: Json | null
          entity?: string
          entity_id?: string
          id?: never
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      board_columns: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          position: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          position: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
      board_items: {
        Row: {
          assigned_to: string | null
          column_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          position: number
          priority: string | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          column_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          column_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_items_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "board_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          channel: string
          created_at: string | null
          created_by: string | null
          id: string
          org_id: string
          title: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          org_id: string
          title?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          org_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          billing_address: Json | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          org_id: string
          payment_terms: string | null
          phone: string | null
          shipping_address: Json | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          org_id: string
          payment_terms?: string | null
          phone?: string | null
          shipping_address?: Json | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          org_id?: string
          payment_terms?: string | null
          phone?: string | null
          shipping_address?: Json | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_agent_conversations: {
        Row: {
          agent_type: string | null
          content: string | null
          context: Json | null
          created_at: string | null
          embedding: string | null
          entities: Json | null
          id: string
          intent: string | null
          message_role: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          agent_type?: string | null
          content?: string | null
          context?: Json | null
          created_at?: string | null
          embedding?: string | null
          entities?: Json | null
          id?: string
          intent?: string | null
          message_role?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          agent_type?: string | null
          content?: string | null
          context?: Json | null
          created_at?: string | null
          embedding?: string | null
          entities?: Json | null
          id?: string
          intent?: string | null
          message_role?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fin_agent_tasks: {
        Row: {
          completed_at: string | null
          conversation_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          started_at: string | null
          status: string | null
          task_type: string | null
        }
        Insert: {
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          task_type?: string | null
        }
        Update: {
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          task_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_agent_tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "fin_agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_customers: {
        Row: {
          address: string | null
          code: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          metadata: Json | null
          name: string
          payment_terms: number | null
          phone: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          payment_terms?: number | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          payment_terms?: number | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fin_export_queue: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          export_format: string | null
          export_type: string
          file_url: string | null
          id: string
          processed_at: string | null
          retry_count: number | null
          scheduled_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          export_format?: string | null
          export_type: string
          file_url?: string | null
          id?: string
          processed_at?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          export_format?: string | null
          export_type?: string
          file_url?: string | null
          id?: string
          processed_at?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      fin_financial_insights: {
        Row: {
          affected_entities: Json | null
          created_at: string | null
          description: string | null
          id: string
          insight_type: string | null
          is_resolved: boolean | null
          resolved_at: string | null
          severity: string | null
          suggested_actions: Json | null
          title: string | null
        }
        Insert: {
          affected_entities?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          insight_type?: string | null
          is_resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          suggested_actions?: Json | null
          title?: string | null
        }
        Update: {
          affected_entities?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          insight_type?: string | null
          is_resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          suggested_actions?: Json | null
          title?: string | null
        }
        Relationships: []
      }
      fin_invoice_items: {
        Row: {
          description: string | null
          discount_percent: number | null
          id: string
          invoice_id: string | null
          metadata: Json | null
          product_id: string | null
          quantity: number
          sort_order: number | null
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          description?: string | null
          discount_percent?: number | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          product_id?: string | null
          quantity: number
          sort_order?: number | null
          subtotal: number
          tax_amount?: number | null
          tax_rate?: number | null
          total: number
          unit?: string | null
          unit_price: number
        }
        Update: {
          description?: string | null
          discount_percent?: number | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          product_id?: string | null
          quantity?: number
          sort_order?: number | null
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "fin_invoice_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "fin_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "fin_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "fin_products_full"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_invoice_templates: {
        Row: {
          brand_logo: string | null
          color_theme: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          font_config: Json | null
          id: string
          is_default: boolean | null
          layout_config: Json
          name: string
          updated_at: string | null
        }
        Insert: {
          brand_logo?: string | null
          color_theme?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          font_config?: Json | null
          id?: string
          is_default?: boolean | null
          layout_config: Json
          name: string
          updated_at?: string | null
        }
        Update: {
          brand_logo?: string | null
          color_theme?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          font_config?: Json | null
          id?: string
          is_default?: boolean | null
          layout_config?: Json
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fin_invoices: {
        Row: {
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          due_date: string | null
          export_status: string | null
          exported_at: string | null
          id: string
          invoice_date: string
          invoice_number: string
          metadata: Json | null
          notes: string | null
          payment_status: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          template_id: string | null
          terms: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          due_date?: string | null
          export_status?: string | null
          exported_at?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          metadata?: Json | null
          notes?: string | null
          payment_status?: string | null
          status?: string | null
          subtotal: number
          tax_amount?: number | null
          template_id?: string | null
          terms?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          due_date?: string | null
          export_status?: string | null
          exported_at?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          metadata?: Json | null
          notes?: string | null
          payment_status?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          template_id?: string | null
          terms?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "fin_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_invoices_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "fin_invoice_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_other_payment_accounts: {
        Row: {
          catatan_akun: string | null
          created_at: string | null
          id: string
          line_number: number
          nama_akun: string
          nama_departemen: string | null
          nilai_akun: number
          no_akun: string
          no_proyek: string | null
          payment_id: string
        }
        Insert: {
          catatan_akun?: string | null
          created_at?: string | null
          id?: string
          line_number: number
          nama_akun: string
          nama_departemen?: string | null
          nilai_akun: number
          no_akun: string
          no_proyek?: string | null
          payment_id: string
        }
        Update: {
          catatan_akun?: string | null
          created_at?: string | null
          id?: string
          line_number?: number
          nama_akun?: string
          nama_departemen?: string | null
          nilai_akun?: number
          no_akun?: string
          no_proyek?: string | null
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_other_payment_accounts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "fin_other_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_other_payments: {
        Row: {
          cabang: string | null
          catatan: string | null
          created_at: string | null
          exported_at: string | null
          extracted_at: string | null
          extraction_confidence: number | null
          id: string
          kas_bank: string
          kurs: string | null
          no_cek: string | null
          no_pembayaran: string | null
          penerima: string | null
          source_file_name: string | null
          source_file_type: string | null
          source_file_url: string | null
          status: string | null
          tanggal: string
          tanggal_cek: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          cabang?: string | null
          catatan?: string | null
          created_at?: string | null
          exported_at?: string | null
          extracted_at?: string | null
          extraction_confidence?: number | null
          id?: string
          kas_bank: string
          kurs?: string | null
          no_cek?: string | null
          no_pembayaran?: string | null
          penerima?: string | null
          source_file_name?: string | null
          source_file_type?: string | null
          source_file_url?: string | null
          status?: string | null
          tanggal: string
          tanggal_cek?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          cabang?: string | null
          catatan?: string | null
          created_at?: string | null
          exported_at?: string | null
          extracted_at?: string | null
          extraction_confidence?: number | null
          id?: string
          kas_bank?: string
          kurs?: string | null
          no_cek?: string | null
          no_pembayaran?: string | null
          penerima?: string | null
          source_file_name?: string | null
          source_file_type?: string | null
          source_file_url?: string | null
          status?: string | null
          tanggal?: string
          tanggal_cek?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      fin_product_custom_fields: {
        Row: {
          char1: string | null
          char10: string | null
          char2: string | null
          char3: string | null
          char4: string | null
          char5: string | null
          char6: string | null
          char7: string | null
          char8: string | null
          char9: string | null
          created_at: string | null
          date1: string | null
          date2: string | null
          id: string
          num1: number | null
          num10: number | null
          num2: number | null
          num3: number | null
          num4: number | null
          num5: number | null
          num6: number | null
          num7: number | null
          num8: number | null
          num9: number | null
          product_id: string
        }
        Insert: {
          char1?: string | null
          char10?: string | null
          char2?: string | null
          char3?: string | null
          char4?: string | null
          char5?: string | null
          char6?: string | null
          char7?: string | null
          char8?: string | null
          char9?: string | null
          created_at?: string | null
          date1?: string | null
          date2?: string | null
          id?: string
          num1?: number | null
          num10?: number | null
          num2?: number | null
          num3?: number | null
          num4?: number | null
          num5?: number | null
          num6?: number | null
          num7?: number | null
          num8?: number | null
          num9?: number | null
          product_id: string
        }
        Update: {
          char1?: string | null
          char10?: string | null
          char2?: string | null
          char3?: string | null
          char4?: string | null
          char5?: string | null
          char6?: string | null
          char7?: string | null
          char8?: string | null
          char9?: string | null
          created_at?: string | null
          date1?: string | null
          date2?: string | null
          id?: string
          num1?: number | null
          num10?: number | null
          num2?: number | null
          num3?: number | null
          num4?: number | null
          num5?: number | null
          num6?: number | null
          num7?: number | null
          num8?: number | null
          num9?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_product_custom_fields_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "fin_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_product_custom_fields_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "fin_products_full"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_product_gl_accounts: {
        Row: {
          cogs_account: string | null
          created_at: string | null
          goods_shipped_account: string | null
          id: string
          inventory_account: string | null
          product_id: string
          purchase_return_account: string | null
          sales_account: string | null
          sales_discount_account: string | null
          sales_return_account: string | null
          unbilled_purchases_account: string | null
        }
        Insert: {
          cogs_account?: string | null
          created_at?: string | null
          goods_shipped_account?: string | null
          id?: string
          inventory_account?: string | null
          product_id: string
          purchase_return_account?: string | null
          sales_account?: string | null
          sales_discount_account?: string | null
          sales_return_account?: string | null
          unbilled_purchases_account?: string | null
        }
        Update: {
          cogs_account?: string | null
          created_at?: string | null
          goods_shipped_account?: string | null
          id?: string
          inventory_account?: string | null
          product_id?: string
          purchase_return_account?: string | null
          sales_account?: string | null
          sales_discount_account?: string | null
          sales_return_account?: string | null
          unbilled_purchases_account?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_product_gl_accounts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "fin_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_product_gl_accounts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "fin_products_full"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_product_opening_stock: {
        Row: {
          as_of_date: string
          branch: string | null
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          unit: string
          unit_value: number | null
          warehouse: string
        }
        Insert: {
          as_of_date: string
          branch?: string | null
          created_at?: string | null
          id?: string
          product_id: string
          quantity: number
          unit: string
          unit_value?: number | null
          warehouse?: string
        }
        Update: {
          as_of_date?: string
          branch?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          unit?: string
          unit_value?: number | null
          warehouse?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_product_opening_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "fin_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_product_opening_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "fin_products_full"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_product_units: {
        Row: {
          conversion_ratio: number
          created_at: string | null
          id: string
          product_id: string
          sell_price: number | null
          unit_name: string
          unit_number: number
        }
        Insert: {
          conversion_ratio: number
          created_at?: string | null
          id?: string
          product_id: string
          sell_price?: number | null
          unit_name: string
          unit_number: number
        }
        Update: {
          conversion_ratio?: number
          created_at?: string | null
          id?: string
          product_id?: string
          sell_price?: number | null
          unit_name?: string
          unit_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_product_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "fin_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_product_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "fin_products_full"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_products: {
        Row: {
          barcode: string | null
          branch_usage: string | null
          brand: string | null
          can_modify_group_quantity: boolean | null
          category: string | null
          code: string
          created_at: string | null
          default_discount_pct: number | null
          description: string | null
          embedding: string | null
          height_cm: number | null
          id: string
          is_active: boolean | null
          is_control_unit: boolean | null
          is_taxable: boolean | null
          item_type: string | null
          length_cm: number | null
          metadata: Json | null
          minimum_purchase: number | null
          minimum_stock: number | null
          name: string
          notes: string | null
          ppn_base_pct: number | null
          ppnbm: number | null
          price: number | null
          primary_supplier: string | null
          purchase_price: number | null
          purchase_unit: string | null
          sell_price: number | null
          serial_number_type: string | null
          substitute_product_code: string | null
          supplier_id: string | null
          tax_rate: number | null
          unit: string
          updated_at: string | null
          use_expiry_date: boolean | null
          use_serial_number: boolean | null
          use_wholesale_pricing: boolean | null
          weight_gr: number | null
          width_cm: number | null
        }
        Insert: {
          barcode?: string | null
          branch_usage?: string | null
          brand?: string | null
          can_modify_group_quantity?: boolean | null
          category?: string | null
          code: string
          created_at?: string | null
          default_discount_pct?: number | null
          description?: string | null
          embedding?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          is_control_unit?: boolean | null
          is_taxable?: boolean | null
          item_type?: string | null
          length_cm?: number | null
          metadata?: Json | null
          minimum_purchase?: number | null
          minimum_stock?: number | null
          name: string
          notes?: string | null
          ppn_base_pct?: number | null
          ppnbm?: number | null
          price?: number | null
          primary_supplier?: string | null
          purchase_price?: number | null
          purchase_unit?: string | null
          sell_price?: number | null
          serial_number_type?: string | null
          substitute_product_code?: string | null
          supplier_id?: string | null
          tax_rate?: number | null
          unit?: string
          updated_at?: string | null
          use_expiry_date?: boolean | null
          use_serial_number?: boolean | null
          use_wholesale_pricing?: boolean | null
          weight_gr?: number | null
          width_cm?: number | null
        }
        Update: {
          barcode?: string | null
          branch_usage?: string | null
          brand?: string | null
          can_modify_group_quantity?: boolean | null
          category?: string | null
          code?: string
          created_at?: string | null
          default_discount_pct?: number | null
          description?: string | null
          embedding?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          is_control_unit?: boolean | null
          is_taxable?: boolean | null
          item_type?: string | null
          length_cm?: number | null
          metadata?: Json | null
          minimum_purchase?: number | null
          minimum_stock?: number | null
          name?: string
          notes?: string | null
          ppn_base_pct?: number | null
          ppnbm?: number | null
          price?: number | null
          primary_supplier?: string | null
          purchase_price?: number | null
          purchase_unit?: string | null
          sell_price?: number | null
          serial_number_type?: string | null
          substitute_product_code?: string | null
          supplier_id?: string | null
          tax_rate?: number | null
          unit?: string
          updated_at?: string | null
          use_expiry_date?: boolean | null
          use_serial_number?: boolean | null
          use_wholesale_pricing?: boolean | null
          weight_gr?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "fin_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_purchase_invoice_expenses: {
        Row: {
          catatan_akun: string | null
          created_at: string | null
          id: string
          invoice_id: string
          line_number: number
          nama_akun: string
          nama_departemen: string | null
          nilai_akun: number
          no_akun: string
          no_proyek: string | null
        }
        Insert: {
          catatan_akun?: string | null
          created_at?: string | null
          id?: string
          invoice_id: string
          line_number: number
          nama_akun: string
          nama_departemen?: string | null
          nilai_akun: number
          no_akun: string
          no_proyek?: string | null
        }
        Update: {
          catatan_akun?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string
          line_number?: number
          nama_akun?: string
          nama_departemen?: string | null
          nilai_akun?: number
          no_akun?: string
          no_proyek?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_purchase_invoice_expenses_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "fin_purchase_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_purchase_invoice_items: {
        Row: {
          catatan_barang: string | null
          created_at: string | null
          diskon_barang_persen: number | null
          diskon_barang_rp: number | null
          harga_satuan: number
          id: string
          invoice_id: string
          kode_barang: string
          kuantitas: number
          line_number: number
          nama_barang: string
          nama_dept_barang: string | null
          nama_gudang: string | null
          no_proyek_barang: string | null
          product_id: string | null
          satuan: string
        }
        Insert: {
          catatan_barang?: string | null
          created_at?: string | null
          diskon_barang_persen?: number | null
          diskon_barang_rp?: number | null
          harga_satuan: number
          id?: string
          invoice_id: string
          kode_barang: string
          kuantitas: number
          line_number: number
          nama_barang: string
          nama_dept_barang?: string | null
          nama_gudang?: string | null
          no_proyek_barang?: string | null
          product_id?: string | null
          satuan: string
        }
        Update: {
          catatan_barang?: string | null
          created_at?: string | null
          diskon_barang_persen?: number | null
          diskon_barang_rp?: number | null
          harga_satuan?: number
          id?: string
          invoice_id?: string
          kode_barang?: string
          kuantitas?: number
          line_number?: number
          nama_barang?: string
          nama_dept_barang?: string | null
          nama_gudang?: string | null
          no_proyek_barang?: string | null
          product_id?: string | null
          satuan?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_purchase_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "fin_purchase_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_purchase_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "fin_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_purchase_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "fin_products_full"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_purchase_invoices: {
        Row: {
          alamat_faktur: string | null
          bank_pembayaran: string | null
          created_at: string | null
          diskon_faktur_persen: number | null
          diskon_faktur_rp: number | null
          exported_at: string | null
          extracted_at: string | null
          extraction_confidence: number | null
          fob: string | null
          id: string
          kena_ppn: boolean | null
          keterangan: string | null
          nama_cabang: string | null
          nilai_pembayaran: number | null
          no_faktur: string
          no_form: string | null
          no_pemasok: string
          nomor_akun_hutang: string | null
          nomor_bukti: string | null
          nomor_faktur_pajak: string | null
          pengiriman: string | null
          source_file_name: string | null
          source_file_type: string | null
          source_file_url: string | null
          status: string | null
          syarat_pembayaran: string | null
          tagihan_dimuka: boolean | null
          tgl_faktur: string
          tgl_faktur_pajak: string | null
          tgl_pengiriman: string | null
          total_termasuk_ppn: boolean | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          alamat_faktur?: string | null
          bank_pembayaran?: string | null
          created_at?: string | null
          diskon_faktur_persen?: number | null
          diskon_faktur_rp?: number | null
          exported_at?: string | null
          extracted_at?: string | null
          extraction_confidence?: number | null
          fob?: string | null
          id?: string
          kena_ppn?: boolean | null
          keterangan?: string | null
          nama_cabang?: string | null
          nilai_pembayaran?: number | null
          no_faktur: string
          no_form?: string | null
          no_pemasok: string
          nomor_akun_hutang?: string | null
          nomor_bukti?: string | null
          nomor_faktur_pajak?: string | null
          pengiriman?: string | null
          source_file_name?: string | null
          source_file_type?: string | null
          source_file_url?: string | null
          status?: string | null
          syarat_pembayaran?: string | null
          tagihan_dimuka?: boolean | null
          tgl_faktur: string
          tgl_faktur_pajak?: string | null
          tgl_pengiriman?: string | null
          total_termasuk_ppn?: boolean | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          alamat_faktur?: string | null
          bank_pembayaran?: string | null
          created_at?: string | null
          diskon_faktur_persen?: number | null
          diskon_faktur_rp?: number | null
          exported_at?: string | null
          extracted_at?: string | null
          extraction_confidence?: number | null
          fob?: string | null
          id?: string
          kena_ppn?: boolean | null
          keterangan?: string | null
          nama_cabang?: string | null
          nilai_pembayaran?: number | null
          no_faktur?: string
          no_form?: string | null
          no_pemasok?: string
          nomor_akun_hutang?: string | null
          nomor_bukti?: string | null
          nomor_faktur_pajak?: string | null
          pengiriman?: string | null
          source_file_name?: string | null
          source_file_type?: string | null
          source_file_url?: string | null
          status?: string | null
          syarat_pembayaran?: string | null
          tagihan_dimuka?: boolean | null
          tgl_faktur?: string
          tgl_faktur_pajak?: string | null
          tgl_pengiriman?: string | null
          total_termasuk_ppn?: boolean | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      fin_suppliers: {
        Row: {
          address: string | null
          code: string | null
          created_at: string | null
          email: string | null
          id: string
          metadata: Json | null
          name: string
          payment_terms: number | null
          phone: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          payment_terms?: number | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          payment_terms?: number | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          description: string | null
          discount_percent: number | null
          id: string
          invoice_id: string
          line_subtotal: number
          line_tax: number
          line_total: number
          product_id: string | null
          qty: number
          tax_rate: number | null
          unit: string | null
          unit_price: number
        }
        Insert: {
          description?: string | null
          discount_percent?: number | null
          id?: string
          invoice_id: string
          line_subtotal: number
          line_tax?: number
          line_total: number
          product_id?: string | null
          qty?: number
          tax_rate?: number | null
          unit?: string | null
          unit_price: number
        }
        Update: {
          description?: string | null
          discount_percent?: number | null
          id?: string
          invoice_id?: string
          line_subtotal?: number
          line_tax?: number
          line_total?: number
          product_id?: string | null
          qty?: number
          tax_rate?: number | null
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_sequences: {
        Row: {
          current_no: number
          org_id: string
          period: string
        }
        Insert: {
          current_no?: number
          org_id: string
          period: string
        }
        Update: {
          current_no?: number
          org_id?: string
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_sequences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          created_at: string | null
          created_by: string | null
          currency: string | null
          customer_id: string
          discount_total: number
          due_date: string | null
          id: string
          issue_date: string
          meta: Json | null
          notes: string | null
          number: string
          org_id: string
          pdf_url: string | null
          status: string
          subtotal: number
          tax_total: number
          total: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id: string
          discount_total?: number
          due_date?: string | null
          id?: string
          issue_date?: string
          meta?: Json | null
          notes?: string | null
          number: string
          org_id: string
          pdf_url?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id?: string
          discount_total?: number
          due_date?: string | null
          id?: string
          issue_date?: string
          meta?: Json | null
          notes?: string | null
          number?: string
          org_id?: string
          pdf_url?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          color: string | null
          icon: string | null
          id: string
          name: string
          previous_value: number | null
          unit: string | null
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          color?: string | null
          icon?: string | null
          id?: string
          name: string
          previous_value?: number | null
          unit?: string | null
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          color?: string | null
          icon?: string | null
          id?: string
          name?: string
          previous_value?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          domain: string
          email: string
          id: string
          ip_address: string | null
          project: string
          referrer: string | null
          source: string
          updated_at: string
          user_agent: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          email: string
          id?: string
          ip_address?: string | null
          project: string
          referrer?: string | null
          source: string
          updated_at?: string
          user_agent?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          email?: string
          id?: string
          ip_address?: string | null
          project?: string
          referrer?: string | null
          source?: string
          updated_at?: string
          user_agent?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      nm_canvas_index: {
        Row: {
          canvas_id: string | null
          embedding: string | null
          id: number
          node_id: string
          path: string
          text_body: string
        }
        Insert: {
          canvas_id?: string | null
          embedding?: string | null
          id?: number
          node_id: string
          path: string
          text_body: string
        }
        Update: {
          canvas_id?: string | null
          embedding?: string | null
          id?: number
          node_id?: string
          path?: string
          text_body?: string
        }
        Relationships: [
          {
            foreignKeyName: "nm_canvas_index_canvas_id_fkey"
            columns: ["canvas_id"]
            isOneToOne: false
            referencedRelation: "nm_canvases"
            referencedColumns: ["id"]
          },
        ]
      }
      nm_canvases: {
        Row: {
          created_at: string | null
          data_json: Json
          id: string
          preview_png: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_json?: Json
          id?: string
          preview_png?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_json?: Json
          id?: string
          preview_png?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nm_note_chunks: {
        Row: {
          chunk_idx: number
          chunk_text: string
          embedding: string | null
          id: number
          note_id: string | null
        }
        Insert: {
          chunk_idx: number
          chunk_text: string
          embedding?: string | null
          id?: number
          note_id?: string | null
        }
        Update: {
          chunk_idx?: number
          chunk_text?: string
          embedding?: string | null
          id?: number
          note_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nm_note_chunks_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "nm_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      nm_notes: {
        Row: {
          archived: boolean | null
          content_json: Json
          content_text: string
          created_at: string | null
          id: string
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          content_json?: Json
          content_text?: string
          created_at?: string | null
          id?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          content_json?: Json
          content_text?: string
          created_at?: string | null
          id?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nm_reminders: {
        Row: {
          active: boolean | null
          cron: string | null
          id: string
          last_run: string | null
          target_whatsapp: string | null
          template: string | null
          title: string | null
        }
        Insert: {
          active?: boolean | null
          cron?: string | null
          id?: string
          last_run?: string | null
          target_whatsapp?: string | null
          template?: string | null
          title?: string | null
        }
        Update: {
          active?: boolean | null
          cron?: string | null
          id?: string
          last_run?: string | null
          target_whatsapp?: string | null
          template?: string | null
          title?: string | null
        }
        Relationships: []
      }
      org_members: {
        Row: {
          created_at: string | null
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          org_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          name: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string
          method: string | null
          org_id: string
          paid_at: string
          proof_url: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id: string
          method?: string | null
          org_id: string
          paid_at?: string
          proof_url?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string
          method?: string | null
          org_id?: string
          paid_at?: string
          proof_url?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list_items: {
        Row: {
          discount_percent: number | null
          id: string
          price_list_id: string
          product_id: string
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          discount_percent?: number | null
          id?: string
          price_list_id: string
          product_id: string
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          discount_percent?: number | null
          id?: string
          price_list_id?: string
          product_id?: string
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          created_at: string | null
          customer_id: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string
          scope: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id: string
          scope: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string
          scope?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_lists_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_lists_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          priority: string | null
          source: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          source?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          source?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      screenshots: {
        Row: {
          filename: string
          id: number
          metadata: Json | null
          platform: string
          public_url: string | null
          timestamp: string | null
          url: string
        }
        Insert: {
          filename: string
          id?: number
          metadata?: Json | null
          platform: string
          public_url?: string | null
          timestamp?: string | null
          url: string
        }
        Update: {
          filename?: string
          id?: number
          metadata?: Json | null
          platform?: string
          public_url?: string | null
          timestamp?: string | null
          url?: string
        }
        Relationships: []
      }
      seller_dashboard_data: {
        Row: {
          id: number
          metrics: Json | null
          platform: string | null
          raw_data: Json | null
          scraped_at: string | null
          timestamp: string | null
          url: string | null
        }
        Insert: {
          id?: number
          metrics?: Json | null
          platform?: string | null
          raw_data?: Json | null
          scraped_at?: string | null
          timestamp?: string | null
          url?: string | null
        }
        Update: {
          id?: number
          metrics?: Json | null
          platform?: string | null
          raw_data?: Json | null
          scraped_at?: string | null
          timestamp?: string | null
          url?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          from_email: string | null
          id: string
          projects_filter: Json | null
          resend_api_key: string | null
          smtp_host: string | null
          smtp_pass: string | null
          smtp_port: number | null
          smtp_user: string | null
          telegram_bot_token: string | null
          telegram_chat_ids: string | null
          to_emails: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_email?: string | null
          id?: string
          projects_filter?: Json | null
          resend_api_key?: string | null
          smtp_host?: string | null
          smtp_pass?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          telegram_bot_token?: string | null
          telegram_chat_ids?: string | null
          to_emails?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_email?: string | null
          id?: string
          projects_filter?: Json | null
          resend_api_key?: string | null
          smtp_host?: string | null
          smtp_pass?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          telegram_bot_token?: string | null
          telegram_chat_ids?: string | null
          to_emails?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sites: {
        Row: {
          created_at: string | null
          default_template_id: string | null
          id: string
          name: string
          public_key: string
          slug: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_template_id?: string | null
          id?: string
          name: string
          public_key?: string
          slug: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_template_id?: string | null
          id?: string
          name?: string
          public_key?: string
          slug?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sites_default_template"
            columns: ["default_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_links: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          telegram_user_id: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id: string
          telegram_user_id: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          telegram_user_id?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_links_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_settings: {
        Row: {
          chat_id: string
          created_at: string
          daily_brief_time: string | null
          id: string
          is_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          daily_brief_time?: string | null
          id?: string
          is_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          daily_brief_time?: string | null
          id?: string
          is_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string | null
          css_reference: string | null
          html_layout: string | null
          id: string
          is_default: boolean | null
          js_reference: string | null
          name: string
          site_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          css_reference?: string | null
          html_layout?: string | null
          id?: string
          is_default?: boolean | null
          js_reference?: string | null
          name: string
          site_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          css_reference?: string | null
          html_layout?: string | null
          id?: string
          is_default?: boolean | null
          js_reference?: string | null
          name?: string
          site_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      weekly_targets: {
        Row: {
          created_at: string
          current_value: number | null
          description: string | null
          id: string
          is_completed: boolean | null
          target_value: number | null
          title: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          target_value?: number | null
          title: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          target_value?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      daily_summary: {
        Row: {
          date: string | null
          latest_screenshot: string | null
          platform: string | null
          screenshot_count: number | null
          successful_uploads: number | null
        }
        Relationships: []
      }
      fin_invoice_summary: {
        Row: {
          customer_company: string | null
          customer_name: string | null
          due_date: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          item_count: number | null
          payment_status: string | null
          status: string | null
          total: number | null
        }
        Relationships: []
      }
      fin_products_full: {
        Row: {
          alternative_units: Json | null
          barcode: string | null
          branch_usage: string | null
          brand: string | null
          can_modify_group_quantity: boolean | null
          category: string | null
          char1: string | null
          char2: string | null
          char3: string | null
          char4: string | null
          char5: string | null
          code: string | null
          cogs_account: string | null
          created_at: string | null
          date1: string | null
          date2: string | null
          default_discount_pct: number | null
          description: string | null
          embedding: string | null
          height_cm: number | null
          id: string | null
          inventory_account: string | null
          is_active: boolean | null
          is_control_unit: boolean | null
          is_taxable: boolean | null
          item_type: string | null
          length_cm: number | null
          metadata: Json | null
          minimum_purchase: number | null
          minimum_stock: number | null
          name: string | null
          notes: string | null
          num1: number | null
          num2: number | null
          num3: number | null
          num4: number | null
          num5: number | null
          opening_stock: Json | null
          ppn_base_pct: number | null
          ppnbm: number | null
          price: number | null
          primary_supplier: string | null
          purchase_price: number | null
          purchase_unit: string | null
          sales_account: string | null
          sell_price: number | null
          serial_number_type: string | null
          substitute_product_code: string | null
          supplier_id: string | null
          tax_rate: number | null
          unit: string | null
          updated_at: string | null
          use_expiry_date: boolean | null
          use_serial_number: boolean | null
          use_wholesale_pricing: boolean | null
          weight_gr: number | null
          width_cm: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "fin_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_scheduled_posts: {
        Args: never
        Returns: {
          post_id: string
          publish_at: string
          title: string
        }[]
      }
      cleanup_old_screenshots: { Args: never; Returns: undefined }
      ensure_invoice_sequence: {
        Args: { p_org_id: string; p_period: string }
        Returns: number
      }
      get_publishing_stats: {
        Args: never
        Returns: {
          draft_posts: number
          posts_published_today: number
          posts_scheduled_today: number
          published_posts: number
          scheduled_posts: number
          total_posts: number
        }[]
      }
      nm_match_canvas_index: {
        Args: {
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          canvas_id: string
          path: string
          similarity: number
          text_body: string
        }[]
      }
      nm_match_note_chunks: {
        Args: {
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          chunk_text: string
          note_id: string
          similarity: number
        }[]
      }
      publish_scheduled_post: { Args: { post_uuid: string }; Returns: boolean }
      render_markdown_to_html: {
        Args: { markdown_text: string }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      post_status: "draft" | "review" | "scheduled" | "published" | "archived"
      publish_action: "publish" | "unpublish" | "schedule" | "rollback"
      user_role: "admin" | "publisher" | "editor" | "writer" | "viewer"
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
      post_status: ["draft", "review", "scheduled", "published", "archived"],
      publish_action: ["publish", "unpublish", "schedule", "rollback"],
      user_role: ["admin", "publisher", "editor", "writer", "viewer"],
    },
  },
} as const
