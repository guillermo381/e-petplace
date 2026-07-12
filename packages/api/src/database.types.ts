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
      _test_resultado_d242: {
        Row: {
          check_nombre: string | null
          corrida_en: string | null
          esperado: string | null
          obtenido: string | null
          paso: boolean | null
        }
        Insert: {
          check_nombre?: string | null
          corrida_en?: string | null
          esperado?: string | null
          obtenido?: string | null
          paso?: boolean | null
        }
        Update: {
          check_nombre?: string | null
          corrida_en?: string | null
          esperado?: string | null
          obtenido?: string | null
          paso?: boolean | null
        }
        Relationships: []
      }
      accion_destructiva_pendiente: {
        Row: {
          codueños_pendientes_snapshot: Json
          created_at: string
          ejecutado_en: string | null
          estado: string
          expira_en: string
          familia_id: string
          id: string
          mascota_id: string
          motivo_resolucion: string | null
          payload: Json
          propuesto_en: string
          propuesto_por_user_id: string
          resuelto_en: string | null
          tipo_accion: string
          updated_at: string
        }
        Insert: {
          codueños_pendientes_snapshot: Json
          created_at?: string
          ejecutado_en?: string | null
          estado?: string
          expira_en?: string
          familia_id: string
          id?: string
          mascota_id: string
          motivo_resolucion?: string | null
          payload?: Json
          propuesto_en?: string
          propuesto_por_user_id: string
          resuelto_en?: string | null
          tipo_accion: string
          updated_at?: string
        }
        Update: {
          codueños_pendientes_snapshot?: Json
          created_at?: string
          ejecutado_en?: string | null
          estado?: string
          expira_en?: string
          familia_id?: string
          id?: string
          mascota_id?: string
          motivo_resolucion?: string | null
          payload?: Json
          propuesto_en?: string
          propuesto_por_user_id?: string
          resuelto_en?: string | null
          tipo_accion?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accion_destructiva_pendiente_familia_id_fkey"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accion_destructiva_pendiente_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_permisos: {
        Row: {
          accion: string
          activo: boolean
          id: string
          modulo: string
          rol_id: string
        }
        Insert: {
          accion: string
          activo?: boolean
          id?: string
          modulo: string
          rol_id: string
        }
        Update: {
          accion?: string
          activo?: boolean
          id?: string
          modulo?: string
          rol_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_permisos_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          created_at: string
          descripcion: string | null
          es_sistema: boolean
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          es_sistema?: boolean
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          es_sistema?: boolean
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          activo: boolean | null
          created_at: string | null
          email: string
          id: string
          nombre: string | null
          rol: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          email: string
          id: string
          nombre?: string | null
          rol?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string | null
          rol?: string | null
        }
        Relationships: []
      }
      admin_usuarios_roles: {
        Row: {
          activo: boolean
          asignado_en: string
          asignado_por: string | null
          id: string
          rol_id: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          asignado_en?: string
          asignado_por?: string | null
          id?: string
          rol_id: string
          user_id: string
        }
        Update: {
          activo?: boolean
          asignado_en?: string
          asignado_por?: string | null
          id?: string
          rol_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_usuarios_roles_asignado_por_fkey"
            columns: ["asignado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_usuarios_roles_asignado_por_fkey"
            columns: ["asignado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_usuarios_roles_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_usuarios_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_usuarios_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      adopcion_seguimiento: {
        Row: {
          adoptante_id: string
          comentarios: string | null
          completado: boolean
          completado_en: string | null
          created_at: string
          descripcion: string | null
          estado_mascota: string
          felicidad_adoptante: number | null
          fotos: Json | null
          id: string
          mascota_id: string
          recordatorio_enviado: boolean | null
          solicitud_id: string
          tipo: string
        }
        Insert: {
          adoptante_id: string
          comentarios?: string | null
          completado?: boolean
          completado_en?: string | null
          created_at?: string
          descripcion?: string | null
          estado_mascota?: string
          felicidad_adoptante?: number | null
          fotos?: Json | null
          id?: string
          mascota_id: string
          recordatorio_enviado?: boolean | null
          solicitud_id: string
          tipo: string
        }
        Update: {
          adoptante_id?: string
          comentarios?: string | null
          completado?: boolean
          completado_en?: string | null
          created_at?: string
          descripcion?: string | null
          estado_mascota?: string
          felicidad_adoptante?: number | null
          fotos?: Json | null
          id?: string
          mascota_id?: string
          recordatorio_enviado?: boolean | null
          solicitud_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "adopcion_seguimiento_adoptante_id_fkey"
            columns: ["adoptante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adopcion_seguimiento_adoptante_id_fkey"
            columns: ["adoptante_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "adopcion_seguimiento_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas_adopcion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adopcion_seguimiento_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_adopcion"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_aggregated: {
        Row: {
          active_users: number | null
          alerts_count: number | null
          avg_daily_steps: number | null
          avg_heart_rate: number | null
          avg_order_value: number | null
          calculated_at: string
          country_code: string
          dimension_type: string
          dimension_value: string
          id: string
          orders_count: number | null
          orders_revenue: number | null
          report_date: string
          services_count: number | null
          total_pets: number | null
          vaccines_count: number | null
        }
        Insert: {
          active_users?: number | null
          alerts_count?: number | null
          avg_daily_steps?: number | null
          avg_heart_rate?: number | null
          avg_order_value?: number | null
          calculated_at?: string
          country_code: string
          dimension_type: string
          dimension_value: string
          id?: string
          orders_count?: number | null
          orders_revenue?: number | null
          report_date: string
          services_count?: number | null
          total_pets?: number | null
          vaccines_count?: number | null
        }
        Update: {
          active_users?: number | null
          alerts_count?: number | null
          avg_daily_steps?: number | null
          avg_heart_rate?: number | null
          avg_order_value?: number | null
          calculated_at?: string
          country_code?: string
          dimension_type?: string
          dimension_value?: string
          id?: string
          orders_count?: number | null
          orders_revenue?: number | null
          report_date?: string
          services_count?: number | null
          total_pets?: number | null
          vaccines_count?: number | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          anonymous_id: string | null
          app_version: string | null
          country_code: string
          event_name: string
          event_properties: Json | null
          id: string
          ingested_at: string
          occurred_at: string
          platform: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          app_version?: string | null
          country_code?: string
          event_name: string
          event_properties?: Json | null
          id?: string
          ingested_at?: string
          occurred_at?: string
          platform?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          app_version?: string | null
          country_code?: string
          event_name?: string
          event_properties?: Json | null
          id?: string
          ingested_at?: string
          occurred_at?: string
          platform?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      app_config: {
        Row: {
          categoria: string
          clave: string
          created_at: string
          descripcion: string | null
          es_publico: boolean
          id: string
          tipo: string
          updated_at: string
          updated_by: string | null
          valor: string
        }
        Insert: {
          categoria?: string
          clave: string
          created_at?: string
          descripcion?: string | null
          es_publico?: boolean
          id?: string
          tipo?: string
          updated_at?: string
          updated_by?: string | null
          valor: string
        }
        Update: {
          categoria?: string
          clave?: string
          created_at?: string
          descripcion?: string | null
          es_publico?: boolean
          id?: string
          tipo?: string
          updated_at?: string
          updated_by?: string | null
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_log: {
        Row: {
          accion: string
          created_at: string
          datos_antes: Json | null
          datos_despues: Json | null
          entidad_id: string | null
          id: string
          ip_address: string | null
          modulo: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          entidad_id?: string | null
          id?: string
          ip_address?: string | null
          modulo: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          entidad_id?: string | null
          id?: string
          ip_address?: string | null
          modulo?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      beta_users: {
        Row: {
          country_code: string
          created_at: string
          email: string | null
          id: string
          invite_code: string | null
          invited_by: string | null
          is_active: boolean
          nombre: string | null
          notas: string | null
          updated_at: string
          usado: boolean
          usado_en: string | null
          usado_por: string | null
        }
        Insert: {
          country_code?: string
          created_at?: string
          email?: string | null
          id?: string
          invite_code?: string | null
          invited_by?: string | null
          is_active?: boolean
          nombre?: string | null
          notas?: string | null
          updated_at?: string
          usado?: boolean
          usado_en?: string | null
          usado_por?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string
          email?: string | null
          id?: string
          invite_code?: string | null
          invited_by?: string | null
          is_active?: boolean
          nombre?: string | null
          notas?: string | null
          updated_at?: string
          usado?: boolean
          usado_en?: string | null
          usado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_users_usado_por_fkey"
            columns: ["usado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beta_users_usado_por_fkey"
            columns: ["usado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bonos: {
        Row: {
          agotado_en: string | null
          country_code: string
          created_at: string
          descripcion: string | null
          duracion_minutos: number | null
          empleado_id: string | null
          estado: string
          estado_pago: string
          fecha_compra: string
          fecha_vencimiento: string | null
          id: string
          mascota_id: string | null
          observaciones_cliente: string | null
          precio_por_unidad: number | null
          precio_total: number
          prestador_id: string
          tipo_servicio: string
          unidades_total: number
          unidades_usadas: number
          user_id: string
        }
        Insert: {
          agotado_en?: string | null
          country_code?: string
          created_at?: string
          descripcion?: string | null
          duracion_minutos?: number | null
          empleado_id?: string | null
          estado?: string
          estado_pago?: string
          fecha_compra?: string
          fecha_vencimiento?: string | null
          id?: string
          mascota_id?: string | null
          observaciones_cliente?: string | null
          precio_por_unidad?: number | null
          precio_total: number
          prestador_id: string
          tipo_servicio: string
          unidades_total: number
          unidades_usadas?: number
          user_id: string
        }
        Update: {
          agotado_en?: string | null
          country_code?: string
          created_at?: string
          descripcion?: string | null
          duracion_minutos?: number | null
          empleado_id?: string | null
          estado?: string
          estado_pago?: string
          fecha_compra?: string
          fecha_vencimiento?: string | null
          id?: string
          mascota_id?: string | null
          observaciones_cliente?: string | null
          precio_por_unidad?: number | null
          precio_total?: number
          prestador_id?: string
          tipo_servicio?: string
          unidades_total?: number
          unidades_usadas?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonos_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonos_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      campanas: {
        Row: {
          canal: string
          country_code: string
          creado_por: string | null
          created_at: string
          cuerpo_mensaje: string
          cupon_id: string | null
          descripcion: string | null
          enviada_en: string | null
          estado: string
          id: string
          imagen_url: string | null
          nombre: string
          programada_para: string | null
          segmento: string
          segmento_valor: string | null
          titulo_mensaje: string
          total_abiertos: number | null
          total_clics: number | null
          total_conversiones: number | null
          total_destinatarios: number | null
          total_enviados: number | null
          updated_at: string
          url_destino: string | null
        }
        Insert: {
          canal: string
          country_code?: string
          creado_por?: string | null
          created_at?: string
          cuerpo_mensaje: string
          cupon_id?: string | null
          descripcion?: string | null
          enviada_en?: string | null
          estado?: string
          id?: string
          imagen_url?: string | null
          nombre: string
          programada_para?: string | null
          segmento?: string
          segmento_valor?: string | null
          titulo_mensaje: string
          total_abiertos?: number | null
          total_clics?: number | null
          total_conversiones?: number | null
          total_destinatarios?: number | null
          total_enviados?: number | null
          updated_at?: string
          url_destino?: string | null
        }
        Update: {
          canal?: string
          country_code?: string
          creado_por?: string | null
          created_at?: string
          cuerpo_mensaje?: string
          cupon_id?: string | null
          descripcion?: string | null
          enviada_en?: string | null
          estado?: string
          id?: string
          imagen_url?: string | null
          nombre?: string
          programada_para?: string | null
          segmento?: string
          segmento_valor?: string | null
          titulo_mensaje?: string
          total_abiertos?: number | null
          total_clics?: number | null
          total_conversiones?: number | null
          total_destinatarios?: number | null
          total_enviados?: number | null
          updated_at?: string
          url_destino?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campanas_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanas_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "campanas_cupon_id_fkey"
            columns: ["cupon_id"]
            isOneToOne: false
            referencedRelation: "cupones"
            referencedColumns: ["id"]
          },
        ]
      }
      caso_clinico: {
        Row: {
          abierto_por_user_id: string | null
          condicion: string
          created_at: string
          cuenta_comercial_tratante_id: string
          empleado_tratante_id: string | null
          estado: string
          evento_origen_id: string | null
          fecha_apertura: string
          fecha_cierre: string | null
          horizonte_proximo_evento: string | null
          id: string
          mascota_id: string
          motivo_cierre: string | null
          updated_at: string
        }
        Insert: {
          abierto_por_user_id?: string | null
          condicion: string
          created_at?: string
          cuenta_comercial_tratante_id: string
          empleado_tratante_id?: string | null
          estado?: string
          evento_origen_id?: string | null
          fecha_apertura?: string
          fecha_cierre?: string | null
          horizonte_proximo_evento?: string | null
          id?: string
          mascota_id: string
          motivo_cierre?: string | null
          updated_at?: string
        }
        Update: {
          abierto_por_user_id?: string | null
          condicion?: string
          created_at?: string
          cuenta_comercial_tratante_id?: string
          empleado_tratante_id?: string | null
          estado?: string
          evento_origen_id?: string | null
          fecha_apertura?: string
          fecha_cierre?: string | null
          horizonte_proximo_evento?: string | null
          id?: string
          mascota_id?: string
          motivo_cierre?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caso_clinico_cuenta_comercial_tratante_id_fkey"
            columns: ["cuenta_comercial_tratante_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caso_clinico_cuenta_comercial_tratante_id_fkey"
            columns: ["cuenta_comercial_tratante_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
          {
            foreignKeyName: "caso_clinico_evento_origen_id_fkey"
            columns: ["evento_origen_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caso_clinico_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      caso_clinico_consultor: {
        Row: {
          agregado_por_user_id: string | null
          caso_clinico_id: string
          created_at: string
          cuenta_comercial_consultor_id: string
          desde: string
          empleado_consultor_id: string | null
          hasta: string | null
          id: string
          motivo_alta: string | null
          motivo_cierre: string | null
          updated_at: string
        }
        Insert: {
          agregado_por_user_id?: string | null
          caso_clinico_id: string
          created_at?: string
          cuenta_comercial_consultor_id: string
          desde?: string
          empleado_consultor_id?: string | null
          hasta?: string | null
          id?: string
          motivo_alta?: string | null
          motivo_cierre?: string | null
          updated_at?: string
        }
        Update: {
          agregado_por_user_id?: string | null
          caso_clinico_id?: string
          created_at?: string
          cuenta_comercial_consultor_id?: string
          desde?: string
          empleado_consultor_id?: string | null
          hasta?: string | null
          id?: string
          motivo_alta?: string | null
          motivo_cierre?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caso_clinico_consultor_caso_clinico_id_fkey"
            columns: ["caso_clinico_id"]
            isOneToOne: false
            referencedRelation: "caso_clinico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caso_clinico_consultor_cuenta_comercial_consultor_id_fkey"
            columns: ["cuenta_comercial_consultor_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caso_clinico_consultor_cuenta_comercial_consultor_id_fkey"
            columns: ["cuenta_comercial_consultor_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
        ]
      }
      cat_bancos: {
        Row: {
          activo: boolean
          codigo: string
          country_code: string
          created_at: string
          id: string
          nombre: string
          nombre_oficial: string | null
          orden: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          country_code: string
          created_at?: string
          id?: string
          nombre: string
          nombre_oficial?: string | null
          orden?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          country_code?: string
          created_at?: string
          id?: string
          nombre?: string
          nombre_oficial?: string | null
          orden?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cat_bancos_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "cat_paises"
            referencedColumns: ["codigo_iso2"]
          },
        ]
      }
      cat_categorias_archivo: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          nombre: string
          orden_display: number
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          nombre: string
          orden_display: number
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          nombre?: string
          orden_display?: number
        }
        Relationships: []
      }
      cat_ejes_jtbd: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          descripcion: string
          nombre: string
          orden_display: number
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          descripcion: string
          nombre: string
          orden_display: number
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          descripcion?: string
          nombre?: string
          orden_display?: number
        }
        Relationships: []
      }
      cat_especies: {
        Row: {
          acepta_nuevos_registros: boolean
          activo: boolean
          codigo: string
          created_at: string
          motivo_estado: string | null
          nivel_soporte: string
          nombre: string
          orden_display: number
          updated_at: string
        }
        Insert: {
          acepta_nuevos_registros?: boolean
          activo?: boolean
          codigo: string
          created_at?: string
          motivo_estado?: string | null
          nivel_soporte?: string
          nombre: string
          orden_display: number
          updated_at?: string
        }
        Update: {
          acepta_nuevos_registros?: boolean
          activo?: boolean
          codigo?: string
          created_at?: string
          motivo_estado?: string | null
          nivel_soporte?: string
          nombre?: string
          orden_display?: number
          updated_at?: string
        }
        Relationships: []
      }
      cat_especies_perfil: {
        Row: {
          created_at: string
          especie_codigo: string
          jtbds_aplicables: string[]
          modo_publico_default: string
          momentos_vitales_jsonb: Json
          notas_operativas: string | null
          tipos_evento_aplicables: string[]
          tipos_prestador_aplicables: string[]
          updated_at: string
          visibilidad_default_jsonb: Json
        }
        Insert: {
          created_at?: string
          especie_codigo: string
          jtbds_aplicables?: string[]
          modo_publico_default?: string
          momentos_vitales_jsonb?: Json
          notas_operativas?: string | null
          tipos_evento_aplicables?: string[]
          tipos_prestador_aplicables?: string[]
          updated_at?: string
          visibilidad_default_jsonb?: Json
        }
        Update: {
          created_at?: string
          especie_codigo?: string
          jtbds_aplicables?: string[]
          modo_publico_default?: string
          momentos_vitales_jsonb?: Json
          notas_operativas?: string | null
          tipos_evento_aplicables?: string[]
          tipos_prestador_aplicables?: string[]
          updated_at?: string
          visibilidad_default_jsonb?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cat_especies_perfil_especie_codigo_fkey"
            columns: ["especie_codigo"]
            isOneToOne: true
            referencedRelation: "cat_especies"
            referencedColumns: ["codigo"]
          },
        ]
      }
      cat_especies_vocabulario: {
        Row: {
          clave: string
          created_at: string
          especie_codigo: string
          id: string
          idioma_codigo: string
          notas: string | null
          updated_at: string
          valor: string
        }
        Insert: {
          clave: string
          created_at?: string
          especie_codigo: string
          id?: string
          idioma_codigo: string
          notas?: string | null
          updated_at?: string
          valor: string
        }
        Update: {
          clave?: string
          created_at?: string
          especie_codigo?: string
          id?: string
          idioma_codigo?: string
          notas?: string | null
          updated_at?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "cat_especies_vocabulario_especie_codigo_fkey"
            columns: ["especie_codigo"]
            isOneToOne: false
            referencedRelation: "cat_especies"
            referencedColumns: ["codigo"]
          },
        ]
      }
      cat_estados_pelaje: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          descripcion: string | null
          es_seed_preliminar: boolean
          momento: string
          nombre: string
          orden_display: number
          pais_codigo: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          momento: string
          nombre: string
          orden_display?: number
          pais_codigo?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          momento?: string
          nombre?: string
          orden_display?: number
          pais_codigo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cat_incidencias_grooming: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          descripcion: string | null
          es_seed_preliminar: boolean
          nombre: string
          orden_display: number
          pais_codigo: string | null
          severidad_sugerida: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          nombre: string
          orden_display?: number
          pais_codigo?: string | null
          severidad_sugerida?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          nombre?: string
          orden_display?: number
          pais_codigo?: string | null
          severidad_sugerida?: string
          updated_at?: string
        }
        Relationships: []
      }
      cat_incidencias_paseo: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          descripcion: string | null
          es_seed_preliminar: boolean
          nombre: string
          orden_display: number
          pais_codigo: string | null
          severidad_sugerida: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          nombre: string
          orden_display?: number
          pais_codigo?: string | null
          severidad_sugerida?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          nombre?: string
          orden_display?: number
          pais_codigo?: string | null
          severidad_sugerida?: string
          updated_at?: string
        }
        Relationships: []
      }
      cat_novedades_paseo: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          descripcion: string | null
          es_seed_preliminar: boolean
          grupo: string
          nombre: string
          nombre_familia: string
          orden_display: number
          pais_codigo: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          grupo: string
          nombre: string
          nombre_familia: string
          orden_display?: number
          pais_codigo?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          grupo?: string
          nombre?: string
          nombre_familia?: string
          orden_display?: number
          pais_codigo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cat_paises: {
        Row: {
          activo: boolean
          codigo_iso2: string
          codigo_iso3: string
          created_at: string
          formato_telefono: string | null
          mascara_id_fiscal: Json
          moneda_default: string
          nombre: string
          orden: number
          prefijo_telefono: string
          tipos_fiscales_soportados: string[]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo_iso2: string
          codigo_iso3: string
          created_at?: string
          formato_telefono?: string | null
          mascara_id_fiscal?: Json
          moneda_default: string
          nombre: string
          orden?: number
          prefijo_telefono: string
          tipos_fiscales_soportados?: string[]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo_iso2?: string
          codigo_iso3?: string
          created_at?: string
          formato_telefono?: string | null
          mascara_id_fiscal?: Json
          moneda_default?: string
          nombre?: string
          orden?: number
          prefijo_telefono?: string
          tipos_fiscales_soportados?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      cat_productos_oficio: {
        Row: {
          activo: boolean
          codigo: string
          componentes: Json | null
          created_at: string
          descripcion: string | null
          es_seed_preliminar: boolean
          familias_aplicables: string[]
          nombre: string
          orden_display: number
          pais_codigo: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          componentes?: Json | null
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          familias_aplicables?: string[]
          nombre: string
          orden_display?: number
          pais_codigo?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          componentes?: Json | null
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          familias_aplicables?: string[]
          nombre?: string
          orden_display?: number
          pais_codigo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cat_restricciones_servicio: {
        Row: {
          activo: boolean
          country_code: string
          created_at: string
          criterio: Json
          descripcion: string
          duracion_dias: number | null
          familia_servicio: string
          id: string
          severidad: string
          tipo_antecedente: string
          updated_at: string
          validado: boolean
        }
        Insert: {
          activo?: boolean
          country_code: string
          created_at?: string
          criterio?: Json
          descripcion: string
          duracion_dias?: number | null
          familia_servicio: string
          id?: string
          severidad: string
          tipo_antecedente: string
          updated_at?: string
          validado?: boolean
        }
        Update: {
          activo?: boolean
          country_code?: string
          created_at?: string
          criterio?: Json
          descripcion?: string
          duracion_dias?: number | null
          familia_servicio?: string
          id?: string
          severidad?: string
          tipo_antecedente?: string
          updated_at?: string
          validado?: boolean
        }
        Relationships: []
      }
      cat_servicios_grooming: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          descripcion: string | null
          es_seed_preliminar: boolean
          nombre: string
          orden_display: number
          pais_codigo: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          nombre: string
          orden_display?: number
          pais_codigo?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          nombre?: string
          orden_display?: number
          pais_codigo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cat_tipos_documento_titular: {
        Row: {
          activo: boolean
          codigo: string
          country_code: string
          created_at: string
          id: string
          mascara_validacion: string | null
          nombre: string
          orden: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          country_code: string
          created_at?: string
          id?: string
          mascara_validacion?: string | null
          nombre: string
          orden?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          country_code?: string
          created_at?: string
          id?: string
          mascara_validacion?: string | null
          nombre?: string
          orden?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cat_tipos_documento_titular_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "cat_paises"
            referencedColumns: ["codigo_iso2"]
          },
        ]
      }
      cat_tipos_evento: {
        Row: {
          activo: boolean
          codigo: string
          color: string | null
          created_at: string
          deprecado: boolean
          deprecado_motivo: string | null
          descripcion: string
          eje_jtbd: string
          es_mvp: boolean
          icono: string | null
          nombre: string
          propaga_a_perfil: boolean
          puede_ser_raiz: boolean
          puede_ser_subevento: boolean
          reemplazado_por: string | null
          tabla_tipada: string | null
          tipos_padre_validos: string[] | null
          updated_at: string
          visibilidad_default: Json
        }
        Insert: {
          activo?: boolean
          codigo: string
          color?: string | null
          created_at?: string
          deprecado?: boolean
          deprecado_motivo?: string | null
          descripcion: string
          eje_jtbd: string
          es_mvp?: boolean
          icono?: string | null
          nombre: string
          propaga_a_perfil?: boolean
          puede_ser_raiz: boolean
          puede_ser_subevento: boolean
          reemplazado_por?: string | null
          tabla_tipada?: string | null
          tipos_padre_validos?: string[] | null
          updated_at?: string
          visibilidad_default?: Json
        }
        Update: {
          activo?: boolean
          codigo?: string
          color?: string | null
          created_at?: string
          deprecado?: boolean
          deprecado_motivo?: string | null
          descripcion?: string
          eje_jtbd?: string
          es_mvp?: boolean
          icono?: string | null
          nombre?: string
          propaga_a_perfil?: boolean
          puede_ser_raiz?: boolean
          puede_ser_subevento?: boolean
          reemplazado_por?: string | null
          tabla_tipada?: string | null
          tipos_padre_validos?: string[] | null
          updated_at?: string
          visibilidad_default?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cat_tipos_evento_eje_jtbd_fkey"
            columns: ["eje_jtbd"]
            isOneToOne: false
            referencedRelation: "cat_ejes_jtbd"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "cat_tipos_evento_reemplazado_por_fkey"
            columns: ["reemplazado_por"]
            isOneToOne: false
            referencedRelation: "cat_tipos_evento"
            referencedColumns: ["codigo"]
          },
        ]
      }
      cat_tipos_pelaje: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          descripcion: string | null
          es_seed_preliminar: boolean
          nombre: string
          orden_display: number
          pais_codigo: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          nombre: string
          orden_display?: number
          pais_codigo?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          nombre?: string
          orden_display?: number
          pais_codigo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cat_zonas_trabajo_grooming: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          descripcion: string | null
          es_seed_preliminar: boolean
          nombre: string
          orden_display: number
          pais_codigo: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          nombre: string
          orden_display?: number
          pais_codigo?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          descripcion?: string | null
          es_seed_preliminar?: boolean
          nombre?: string
          orden_display?: number
          pais_codigo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      certificaciones: {
        Row: {
          aerolinea: string | null
          archivo_url: string | null
          cita_id: string | null
          country_code: string
          created_at: string
          descripcion: string | null
          emitido_en: string
          entidad_emisora: string | null
          estado: string
          fecha_viaje: string | null
          hash_verificacion: string | null
          id: string
          mascota_id: string
          numero_certificado: string | null
          numero_registro_entidad: string | null
          pais_destino: string | null
          prestador_id: string | null
          qr_code_url: string | null
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
          vence_en: string | null
          veterinario_matricula: string | null
          veterinario_nombre: string | null
        }
        Insert: {
          aerolinea?: string | null
          archivo_url?: string | null
          cita_id?: string | null
          country_code?: string
          created_at?: string
          descripcion?: string | null
          emitido_en?: string
          entidad_emisora?: string | null
          estado?: string
          fecha_viaje?: string | null
          hash_verificacion?: string | null
          id?: string
          mascota_id: string
          numero_certificado?: string | null
          numero_registro_entidad?: string | null
          pais_destino?: string | null
          prestador_id?: string | null
          qr_code_url?: string | null
          tipo: string
          titulo: string
          updated_at?: string
          user_id: string
          vence_en?: string | null
          veterinario_matricula?: string | null
          veterinario_nombre?: string | null
        }
        Update: {
          aerolinea?: string | null
          archivo_url?: string | null
          cita_id?: string | null
          country_code?: string
          created_at?: string
          descripcion?: string | null
          emitido_en?: string
          entidad_emisora?: string | null
          estado?: string
          fecha_viaje?: string | null
          hash_verificacion?: string | null
          id?: string
          mascota_id?: string
          numero_certificado?: string | null
          numero_registro_entidad?: string | null
          pais_destino?: string | null
          prestador_id?: string | null
          qr_code_url?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
          vence_en?: string | null
          veterinario_matricula?: string | null
          veterinario_nombre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificaciones_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "evento_cita_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificaciones_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificaciones_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificaciones_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificaciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificaciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      checkout_sesiones: {
        Row: {
          costo_envio: number | null
          country_code: string
          created_at: string
          cupon_codigo: string | null
          descuento: number | null
          direccion_datos: Json | null
          estado: string
          expira_en: string | null
          id: string
          items: Json
          paso_actual: string | null
          pedido_id: string | null
          session_id: string | null
          subtotal: number | null
          total: number | null
          updated_at: string
          user_id: string | null
          zona_cobertura_id: string | null
        }
        Insert: {
          costo_envio?: number | null
          country_code?: string
          created_at?: string
          cupon_codigo?: string | null
          descuento?: number | null
          direccion_datos?: Json | null
          estado?: string
          expira_en?: string | null
          id?: string
          items?: Json
          paso_actual?: string | null
          pedido_id?: string | null
          session_id?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string
          user_id?: string | null
          zona_cobertura_id?: string | null
        }
        Update: {
          costo_envio?: number | null
          country_code?: string
          created_at?: string
          cupon_codigo?: string | null
          descuento?: number | null
          direccion_datos?: Json | null
          estado?: string
          expira_en?: string | null
          id?: string
          items?: Json
          paso_actual?: string | null
          pedido_id?: string | null
          session_id?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string
          user_id?: string | null
          zona_cobertura_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sesiones_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sesiones_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_logistico"
            referencedColumns: ["pedido_id"]
          },
          {
            foreignKeyName: "checkout_sesiones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sesiones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "checkout_sesiones_zona_cobertura_id_fkey"
            columns: ["zona_cobertura_id"]
            isOneToOne: false
            referencedRelation: "zonas_cobertura"
            referencedColumns: ["id"]
          },
        ]
      }
      cita_telemedicina_detalle: {
        Row: {
          cita_id: string
          country_code: string
          created_at: string
          duracion_minutos: number | null
          estado: string
          fin_real: string | null
          grabacion_consentida: boolean | null
          grabacion_url: string | null
          id: string
          inicio_programado: string
          inicio_real: string | null
          mascota_id: string
          pet_parent_id: string
          prestador_id: string
          proveedor: string
          room_name: string | null
          room_url: string | null
          token_cliente: string | null
          token_prestador: string | null
          updated_at: string
        }
        Insert: {
          cita_id: string
          country_code?: string
          created_at?: string
          duracion_minutos?: number | null
          estado?: string
          fin_real?: string | null
          grabacion_consentida?: boolean | null
          grabacion_url?: string | null
          id?: string
          inicio_programado: string
          inicio_real?: string | null
          mascota_id: string
          pet_parent_id: string
          prestador_id: string
          proveedor?: string
          room_name?: string | null
          room_url?: string | null
          token_cliente?: string | null
          token_prestador?: string | null
          updated_at?: string
        }
        Update: {
          cita_id?: string
          country_code?: string
          created_at?: string
          duracion_minutos?: number | null
          estado?: string
          fin_real?: string | null
          grabacion_consentida?: boolean | null
          grabacion_url?: string | null
          id?: string
          inicio_programado?: string
          inicio_real?: string | null
          mascota_id?: string
          pet_parent_id?: string
          prestador_id?: string
          proveedor?: string
          room_name?: string | null
          room_url?: string | null
          token_cliente?: string | null
          token_prestador?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cita_telemedicina_detalle_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: true
            referencedRelation: "evento_cita_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cita_telemedicina_detalle_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cita_telemedicina_detalle_pet_parent_id_fkey"
            columns: ["pet_parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cita_telemedicina_detalle_pet_parent_id_fkey"
            columns: ["pet_parent_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cita_telemedicina_detalle_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cita_telemedicina_detalle_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_pendiente_registro: {
        Row: {
          completado_en: string | null
          completado_por_user_id: string | null
          country_code: string
          creado_por_cuenta_comercial_id: string
          creado_por_prestador_id: string
          creado_por_user_id: string
          created_at: string
          email: string
          expira_en: string
          familia_id_placeholder: string
          id: string
          nombre: string
          notificaciones_enviadas: number
          notificado_en: string | null
          soporte_resuelto_en: string | null
          telefono: string | null
        }
        Insert: {
          completado_en?: string | null
          completado_por_user_id?: string | null
          country_code: string
          creado_por_cuenta_comercial_id: string
          creado_por_prestador_id: string
          creado_por_user_id: string
          created_at?: string
          email: string
          expira_en?: string
          familia_id_placeholder: string
          id?: string
          nombre: string
          notificaciones_enviadas?: number
          notificado_en?: string | null
          soporte_resuelto_en?: string | null
          telefono?: string | null
        }
        Update: {
          completado_en?: string | null
          completado_por_user_id?: string | null
          country_code?: string
          creado_por_cuenta_comercial_id?: string
          creado_por_prestador_id?: string
          creado_por_user_id?: string
          created_at?: string
          email?: string
          expira_en?: string
          familia_id_placeholder?: string
          id?: string
          nombre?: string
          notificaciones_enviadas?: number
          notificado_en?: string | null
          soporte_resuelto_en?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_pendiente_registro_creado_por_cuenta_comercial_id_fkey"
            columns: ["creado_por_cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_pendiente_registro_creado_por_cuenta_comercial_id_fkey"
            columns: ["creado_por_cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
          {
            foreignKeyName: "cliente_pendiente_registro_creado_por_prestador_id_fkey"
            columns: ["creado_por_prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_pendiente_registro_creado_por_prestador_id_fkey"
            columns: ["creado_por_prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_pendiente_registro_familia_id_placeholder_fkey"
            columns: ["familia_id_placeholder"]
            isOneToOne: true
            referencedRelation: "familia"
            referencedColumns: ["id"]
          },
        ]
      }
      consentimientos: {
        Row: {
          aceptado: boolean | null
          created_at: string | null
          id: string
          ip_hash: string | null
          metadata: Json | null
          tipo: string | null
          user_id: string | null
          version: string | null
        }
        Insert: {
          aceptado?: boolean | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          tipo?: string | null
          user_id?: string | null
          version?: string | null
        }
        Update: {
          aceptado?: boolean | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          tipo?: string | null
          user_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      country_config: {
        Row: {
          beta_only: boolean | null
          country_code: string
          country_name: string
          country_name_en: string
          created_at: string
          currency_code: string
          currency_decimals: number
          currency_symbol: string
          date_format: string
          default_language: string
          flag_emoji: string | null
          free_shipping_threshold: number | null
          id: string
          invoice_system: string | null
          is_active: boolean
          iva_pct: number
          launch_date: string | null
          payment_gateway: string
          payment_gateway_config: Json | null
          phone_prefix: string
          privacy_url: string | null
          requires_ruc: boolean | null
          services_enabled: Json
          shipping_providers: Json | null
          terms_url: string | null
          updated_at: string
        }
        Insert: {
          beta_only?: boolean | null
          country_code: string
          country_name: string
          country_name_en: string
          created_at?: string
          currency_code?: string
          currency_decimals?: number
          currency_symbol?: string
          date_format?: string
          default_language?: string
          flag_emoji?: string | null
          free_shipping_threshold?: number | null
          id?: string
          invoice_system?: string | null
          is_active?: boolean
          iva_pct?: number
          launch_date?: string | null
          payment_gateway?: string
          payment_gateway_config?: Json | null
          phone_prefix?: string
          privacy_url?: string | null
          requires_ruc?: boolean | null
          services_enabled?: Json
          shipping_providers?: Json | null
          terms_url?: string | null
          updated_at?: string
        }
        Update: {
          beta_only?: boolean | null
          country_code?: string
          country_name?: string
          country_name_en?: string
          created_at?: string
          currency_code?: string
          currency_decimals?: number
          currency_symbol?: string
          date_format?: string
          default_language?: string
          flag_emoji?: string | null
          free_shipping_threshold?: number | null
          id?: string
          invoice_system?: string | null
          is_active?: boolean
          iva_pct?: number
          launch_date?: string | null
          payment_gateway?: string
          payment_gateway_config?: Json | null
          phone_prefix?: string
          privacy_url?: string | null
          requires_ruc?: boolean | null
          services_enabled?: Json
          shipping_providers?: Json | null
          terms_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      criadero_cachorros: {
        Row: {
          camada_id: string
          color: string | null
          contrato_url: string | null
          created_at: string
          criadero_id: string
          desparasitaciones: Json | null
          entregado_a: string | null
          entregado_en: string | null
          estado: string
          fotos: Json | null
          id: string
          mascota_id: string | null
          microchip_numero: string | null
          nombre_tentativo: string | null
          numero_registro_pedigree: string | null
          pedigree_url: string | null
          peso_actual_gr: number | null
          peso_nacimiento_gr: number | null
          precio_reserva: number | null
          pruebas_geneticas: Json | null
          reservado_en: string | null
          reservado_por: string | null
          sexo: string
          updated_at: string
          vacunas_aplicadas: Json | null
        }
        Insert: {
          camada_id: string
          color?: string | null
          contrato_url?: string | null
          created_at?: string
          criadero_id: string
          desparasitaciones?: Json | null
          entregado_a?: string | null
          entregado_en?: string | null
          estado?: string
          fotos?: Json | null
          id?: string
          mascota_id?: string | null
          microchip_numero?: string | null
          nombre_tentativo?: string | null
          numero_registro_pedigree?: string | null
          pedigree_url?: string | null
          peso_actual_gr?: number | null
          peso_nacimiento_gr?: number | null
          precio_reserva?: number | null
          pruebas_geneticas?: Json | null
          reservado_en?: string | null
          reservado_por?: string | null
          sexo: string
          updated_at?: string
          vacunas_aplicadas?: Json | null
        }
        Update: {
          camada_id?: string
          color?: string | null
          contrato_url?: string | null
          created_at?: string
          criadero_id?: string
          desparasitaciones?: Json | null
          entregado_a?: string | null
          entregado_en?: string | null
          estado?: string
          fotos?: Json | null
          id?: string
          mascota_id?: string | null
          microchip_numero?: string | null
          nombre_tentativo?: string | null
          numero_registro_pedigree?: string | null
          pedigree_url?: string | null
          peso_actual_gr?: number | null
          peso_nacimiento_gr?: number | null
          precio_reserva?: number | null
          pruebas_geneticas?: Json | null
          reservado_en?: string | null
          reservado_por?: string | null
          sexo?: string
          updated_at?: string
          vacunas_aplicadas?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "criadero_cachorros_camada_id_fkey"
            columns: ["camada_id"]
            isOneToOne: false
            referencedRelation: "criadero_camadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_cachorros_criadero_id_fkey"
            columns: ["criadero_id"]
            isOneToOne: false
            referencedRelation: "criaderos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_cachorros_criadero_id_fkey"
            columns: ["criadero_id"]
            isOneToOne: false
            referencedRelation: "v_criaderos_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_cachorros_entregado_a_fkey"
            columns: ["entregado_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_cachorros_entregado_a_fkey"
            columns: ["entregado_a"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "criadero_cachorros_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_cachorros_reservado_por_fkey"
            columns: ["reservado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_cachorros_reservado_por_fkey"
            columns: ["reservado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      criadero_camadas: {
        Row: {
          country_code: string
          created_at: string
          criadero_id: string
          descripcion: string | null
          estado: string
          fecha_disponible: string | null
          fecha_nacimiento: string
          fotos_camada: Json | null
          fotos_padres: Json | null
          hembras_disponibles: number | null
          id: string
          incluye: Json | null
          machos_disponibles: number | null
          nombre_madre: string | null
          nombre_padre: string | null
          notas_salud: string | null
          pedigree_madre_url: string | null
          pedigree_padre_url: string | null
          precio_hembra: number | null
          precio_macho: number | null
          raza: string
          temperamento: string | null
          total_cachorros: number
          updated_at: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          criadero_id: string
          descripcion?: string | null
          estado?: string
          fecha_disponible?: string | null
          fecha_nacimiento: string
          fotos_camada?: Json | null
          fotos_padres?: Json | null
          hembras_disponibles?: number | null
          id?: string
          incluye?: Json | null
          machos_disponibles?: number | null
          nombre_madre?: string | null
          nombre_padre?: string | null
          notas_salud?: string | null
          pedigree_madre_url?: string | null
          pedigree_padre_url?: string | null
          precio_hembra?: number | null
          precio_macho?: number | null
          raza: string
          temperamento?: string | null
          total_cachorros?: number
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          criadero_id?: string
          descripcion?: string | null
          estado?: string
          fecha_disponible?: string | null
          fecha_nacimiento?: string
          fotos_camada?: Json | null
          fotos_padres?: Json | null
          hembras_disponibles?: number | null
          id?: string
          incluye?: Json | null
          machos_disponibles?: number | null
          nombre_madre?: string | null
          nombre_padre?: string | null
          notas_salud?: string | null
          pedigree_madre_url?: string | null
          pedigree_padre_url?: string | null
          precio_hembra?: number | null
          precio_macho?: number | null
          raza?: string
          temperamento?: string | null
          total_cachorros?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "criadero_camadas_criadero_id_fkey"
            columns: ["criadero_id"]
            isOneToOne: false
            referencedRelation: "criaderos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_camadas_criadero_id_fkey"
            columns: ["criadero_id"]
            isOneToOne: false
            referencedRelation: "v_criaderos_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      criadero_documentos: {
        Row: {
          archivo_url: string
          created_at: string
          criadero_id: string
          estado: string
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string
          nombre: string
          notas: string | null
          revisado_en: string | null
          revisado_por: string | null
          tipo: string
        }
        Insert: {
          archivo_url: string
          created_at?: string
          criadero_id: string
          estado?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nombre: string
          notas?: string | null
          revisado_en?: string | null
          revisado_por?: string | null
          tipo: string
        }
        Update: {
          archivo_url?: string
          created_at?: string
          criadero_id?: string
          estado?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          revisado_en?: string | null
          revisado_por?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "criadero_documentos_criadero_id_fkey"
            columns: ["criadero_id"]
            isOneToOne: false
            referencedRelation: "criaderos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_documentos_criadero_id_fkey"
            columns: ["criadero_id"]
            isOneToOne: false
            referencedRelation: "v_criaderos_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_documentos_revisado_por_fkey"
            columns: ["revisado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_documentos_revisado_por_fkey"
            columns: ["revisado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      criadero_resenas: {
        Row: {
          cachorro_id: string | null
          calificacion: number
          calificacion_atencion: number | null
          calificacion_instalaciones: number | null
          calificacion_salud: number | null
          calificacion_temperamento: number | null
          comentario: string | null
          created_at: string
          criadero_id: string
          es_compra_verificada: boolean | null
          es_visible: boolean
          fotos: Json | null
          id: string
          mascota_id: string | null
          respuesta_criadero: string | null
          respuesta_en: string | null
          titulo: string | null
          user_id: string
        }
        Insert: {
          cachorro_id?: string | null
          calificacion: number
          calificacion_atencion?: number | null
          calificacion_instalaciones?: number | null
          calificacion_salud?: number | null
          calificacion_temperamento?: number | null
          comentario?: string | null
          created_at?: string
          criadero_id: string
          es_compra_verificada?: boolean | null
          es_visible?: boolean
          fotos?: Json | null
          id?: string
          mascota_id?: string | null
          respuesta_criadero?: string | null
          respuesta_en?: string | null
          titulo?: string | null
          user_id: string
        }
        Update: {
          cachorro_id?: string | null
          calificacion?: number
          calificacion_atencion?: number | null
          calificacion_instalaciones?: number | null
          calificacion_salud?: number | null
          calificacion_temperamento?: number | null
          comentario?: string | null
          created_at?: string
          criadero_id?: string
          es_compra_verificada?: boolean | null
          es_visible?: boolean
          fotos?: Json | null
          id?: string
          mascota_id?: string | null
          respuesta_criadero?: string | null
          respuesta_en?: string | null
          titulo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "criadero_resenas_cachorro_id_fkey"
            columns: ["cachorro_id"]
            isOneToOne: false
            referencedRelation: "criadero_cachorros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_resenas_criadero_id_fkey"
            columns: ["criadero_id"]
            isOneToOne: false
            referencedRelation: "criaderos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_resenas_criadero_id_fkey"
            columns: ["criadero_id"]
            isOneToOne: false
            referencedRelation: "v_criaderos_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_resenas_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_resenas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criadero_resenas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      criaderos: {
        Row: {
          calificacion_promedio: number | null
          certificaciones: Json | null
          ciudad: string
          condiciones_vida_descripcion: string | null
          country_code: string
          created_at: string
          cuenta_comercial_id: string
          descripcion: string | null
          direccion: string | null
          edad_minima_entrega_semanas: number | null
          email: string | null
          entrega_con_desparasitacion: boolean | null
          entrega_con_microchip: boolean | null
          entrega_con_vacunas: boolean | null
          especies: Json
          estado: string
          facebook: string | null
          foto_url: string | null
          fotos_galeria: Json | null
          garantia_salud_meses: number | null
          hace_pruebas_geneticas: boolean | null
          historia: string | null
          id: string
          instagram: string | null
          lat: number | null
          lon: number | null
          motivo_rechazo: string | null
          nombre: string
          numero_registro: string | null
          plan: string
          plan_vence_en: string | null
          provincia: string | null
          razas: Json
          registrado_en: string | null
          sitio_web: string | null
          telefono: string | null
          total_cachorros_entregados: number | null
          total_camadas: number | null
          total_resenas: number | null
          updated_at: string
          user_id: string
          verificado_en: string | null
          verificado_por: string | null
          visitas_permitidas: boolean | null
          whatsapp: string | null
        }
        Insert: {
          calificacion_promedio?: number | null
          certificaciones?: Json | null
          ciudad: string
          condiciones_vida_descripcion?: string | null
          country_code?: string
          created_at?: string
          cuenta_comercial_id: string
          descripcion?: string | null
          direccion?: string | null
          edad_minima_entrega_semanas?: number | null
          email?: string | null
          entrega_con_desparasitacion?: boolean | null
          entrega_con_microchip?: boolean | null
          entrega_con_vacunas?: boolean | null
          especies?: Json
          estado?: string
          facebook?: string | null
          foto_url?: string | null
          fotos_galeria?: Json | null
          garantia_salud_meses?: number | null
          hace_pruebas_geneticas?: boolean | null
          historia?: string | null
          id?: string
          instagram?: string | null
          lat?: number | null
          lon?: number | null
          motivo_rechazo?: string | null
          nombre: string
          numero_registro?: string | null
          plan?: string
          plan_vence_en?: string | null
          provincia?: string | null
          razas?: Json
          registrado_en?: string | null
          sitio_web?: string | null
          telefono?: string | null
          total_cachorros_entregados?: number | null
          total_camadas?: number | null
          total_resenas?: number | null
          updated_at?: string
          user_id: string
          verificado_en?: string | null
          verificado_por?: string | null
          visitas_permitidas?: boolean | null
          whatsapp?: string | null
        }
        Update: {
          calificacion_promedio?: number | null
          certificaciones?: Json | null
          ciudad?: string
          condiciones_vida_descripcion?: string | null
          country_code?: string
          created_at?: string
          cuenta_comercial_id?: string
          descripcion?: string | null
          direccion?: string | null
          edad_minima_entrega_semanas?: number | null
          email?: string | null
          entrega_con_desparasitacion?: boolean | null
          entrega_con_microchip?: boolean | null
          entrega_con_vacunas?: boolean | null
          especies?: Json
          estado?: string
          facebook?: string | null
          foto_url?: string | null
          fotos_galeria?: Json | null
          garantia_salud_meses?: number | null
          hace_pruebas_geneticas?: boolean | null
          historia?: string | null
          id?: string
          instagram?: string | null
          lat?: number | null
          lon?: number | null
          motivo_rechazo?: string | null
          nombre?: string
          numero_registro?: string | null
          plan?: string
          plan_vence_en?: string | null
          provincia?: string | null
          razas?: Json
          registrado_en?: string | null
          sitio_web?: string | null
          telefono?: string | null
          total_cachorros_entregados?: number | null
          total_camadas?: number | null
          total_resenas?: number | null
          updated_at?: string
          user_id?: string
          verificado_en?: string | null
          verificado_por?: string | null
          visitas_permitidas?: boolean | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "criaderos_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criaderos_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
          {
            foreignKeyName: "criaderos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criaderos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "criaderos_verificado_por_fkey"
            columns: ["verificado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criaderos_verificado_por_fkey"
            columns: ["verificado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cuenta_roles: {
        Row: {
          activado_en: string
          cerrado_en: string | null
          created_at: string
          cuenta_comercial_id: string
          estado: Database["public"]["Enums"]["estado_cuenta_rol_enum"]
          id: string
          metadata: Json
          suspendido_en: string | null
          suspension_motivo: string | null
          tipo_actor: Database["public"]["Enums"]["tipo_actor_enum"]
          updated_at: string
        }
        Insert: {
          activado_en?: string
          cerrado_en?: string | null
          created_at?: string
          cuenta_comercial_id: string
          estado?: Database["public"]["Enums"]["estado_cuenta_rol_enum"]
          id?: string
          metadata?: Json
          suspendido_en?: string | null
          suspension_motivo?: string | null
          tipo_actor: Database["public"]["Enums"]["tipo_actor_enum"]
          updated_at?: string
        }
        Update: {
          activado_en?: string
          cerrado_en?: string | null
          created_at?: string
          cuenta_comercial_id?: string
          estado?: Database["public"]["Enums"]["estado_cuenta_rol_enum"]
          id?: string
          metadata?: Json
          suspendido_en?: string | null
          suspension_motivo?: string | null
          tipo_actor?: Database["public"]["Enums"]["tipo_actor_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuenta_roles_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuenta_roles_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
        ]
      }
      cuentas_comerciales: {
        Row: {
          activado_en: string | null
          cerrado_en: string | null
          country_code: string
          created_at: string
          datos_bancarios: Json
          estado: Database["public"]["Enums"]["estado_cuenta_comercial_enum"]
          id: string
          identificacion_fiscal: string
          kushki_subaccount_id: string | null
          metadata: Json
          modelo_comercial: Database["public"]["Enums"]["modelo_comercial_enum"]
          moneda: string
          nombre_comercial: string
          owner_profile_id: string
          razon_social: string
          saldo_arrastre: number
          suspendido_en: string | null
          suspension_motivo: string | null
          tipo_fiscal: Database["public"]["Enums"]["tipo_fiscal_enum"]
          updated_at: string
        }
        Insert: {
          activado_en?: string | null
          cerrado_en?: string | null
          country_code: string
          created_at?: string
          datos_bancarios?: Json
          estado?: Database["public"]["Enums"]["estado_cuenta_comercial_enum"]
          id?: string
          identificacion_fiscal: string
          kushki_subaccount_id?: string | null
          metadata?: Json
          modelo_comercial?: Database["public"]["Enums"]["modelo_comercial_enum"]
          moneda?: string
          nombre_comercial: string
          owner_profile_id: string
          razon_social: string
          saldo_arrastre?: number
          suspendido_en?: string | null
          suspension_motivo?: string | null
          tipo_fiscal: Database["public"]["Enums"]["tipo_fiscal_enum"]
          updated_at?: string
        }
        Update: {
          activado_en?: string | null
          cerrado_en?: string | null
          country_code?: string
          created_at?: string
          datos_bancarios?: Json
          estado?: Database["public"]["Enums"]["estado_cuenta_comercial_enum"]
          id?: string
          identificacion_fiscal?: string
          kushki_subaccount_id?: string | null
          metadata?: Json
          modelo_comercial?: Database["public"]["Enums"]["modelo_comercial_enum"]
          moneda?: string
          nombre_comercial?: string
          owner_profile_id?: string
          razon_social?: string
          saldo_arrastre?: number
          suspendido_en?: string | null
          suspension_motivo?: string | null
          tipo_fiscal?: Database["public"]["Enums"]["tipo_fiscal_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuentas_comerciales_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuentas_comerciales_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: true
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cupon_usos: {
        Row: {
          created_at: string
          cupon_id: string
          descuento_aplicado: number
          id: string
          pedido_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          cupon_id: string
          descuento_aplicado?: number
          id?: string
          pedido_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          cupon_id?: string
          descuento_aplicado?: number
          id?: string
          pedido_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cupon_usos_cupon_id_fkey"
            columns: ["cupon_id"]
            isOneToOne: false
            referencedRelation: "cupones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupon_usos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupon_usos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_logistico"
            referencedColumns: ["pedido_id"]
          },
          {
            foreignKeyName: "cupon_usos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupon_usos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cupones: {
        Row: {
          activo: boolean
          aplica_a: string
          aplica_categoria: string | null
          aplica_producto_id: string | null
          codigo: string
          country_code: string
          creado_por: string | null
          created_at: string
          descripcion: string | null
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          monto_minimo: number | null
          solo_primera_compra: boolean
          tipo: string
          updated_at: string
          uso_maximo_total: number | null
          uso_maximo_usuario: number | null
          usos_actuales: number
          valor: number
        }
        Insert: {
          activo?: boolean
          aplica_a?: string
          aplica_categoria?: string | null
          aplica_producto_id?: string | null
          codigo: string
          country_code?: string
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          monto_minimo?: number | null
          solo_primera_compra?: boolean
          tipo: string
          updated_at?: string
          uso_maximo_total?: number | null
          uso_maximo_usuario?: number | null
          usos_actuales?: number
          valor?: number
        }
        Update: {
          activo?: boolean
          aplica_a?: string
          aplica_categoria?: string | null
          aplica_producto_id?: string | null
          codigo?: string
          country_code?: string
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          monto_minimo?: number | null
          solo_primera_compra?: boolean
          tipo?: string
          updated_at?: string
          uso_maximo_total?: number | null
          uso_maximo_usuario?: number | null
          usos_actuales?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cupones_aplica_producto_id_fkey"
            columns: ["aplica_producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupones_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupones_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daas_api_clients: {
        Row: {
          allowed_countries: string[] | null
          allowed_dimensions: string[] | null
          api_key: string
          company_name: string
          contact_email: string
          contract_end: string | null
          contract_start: string | null
          created_at: string
          id: string
          is_active: boolean
          last_accessed_at: string | null
          monthly_fee_usd: number | null
          notes: string | null
          tier: string
        }
        Insert: {
          allowed_countries?: string[] | null
          allowed_dimensions?: string[] | null
          api_key?: string
          company_name: string
          contact_email: string
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          monthly_fee_usd?: number | null
          notes?: string | null
          tier?: string
        }
        Update: {
          allowed_countries?: string[] | null
          allowed_dimensions?: string[] | null
          api_key?: string
          company_name?: string
          contact_email?: string
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          monthly_fee_usd?: number | null
          notes?: string | null
          tier?: string
        }
        Relationships: []
      }
      devoluciones: {
        Row: {
          aprobado_en: string | null
          aprobado_por: string | null
          country_code: string
          created_at: string
          descripcion: string | null
          estado: string
          evidencia_urls: Json | null
          id: string
          metodo_reembolso: string | null
          monto_reembolso: number | null
          motivo: string
          notas_admin: string | null
          pedido_id: string
          reembolsado_en: string | null
          seller_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          aprobado_en?: string | null
          aprobado_por?: string | null
          country_code?: string
          created_at?: string
          descripcion?: string | null
          estado?: string
          evidencia_urls?: Json | null
          id?: string
          metodo_reembolso?: string | null
          monto_reembolso?: number | null
          motivo: string
          notas_admin?: string | null
          pedido_id: string
          reembolsado_en?: string | null
          seller_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          aprobado_en?: string | null
          aprobado_por?: string | null
          country_code?: string
          created_at?: string
          descripcion?: string | null
          estado?: string
          evidencia_urls?: Json | null
          id?: string
          metodo_reembolso?: string | null
          monto_reembolso?: number | null
          motivo?: string
          notas_admin?: string | null
          pedido_id?: string
          reembolsado_en?: string | null
          seller_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devoluciones_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "devoluciones_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_logistico"
            referencedColumns: ["pedido_id"]
          },
          {
            foreignKeyName: "devoluciones_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "devoluciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devoluciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      direcciones_guardadas: {
        Row: {
          alias: string
          ciudad: string
          country_code: string
          created_at: string
          direccion: string
          es_principal: boolean
          id: string
          lat: number | null
          lon: number | null
          nombre_receptor: string | null
          referencias: string | null
          sector: string | null
          telefono: string | null
          user_id: string
        }
        Insert: {
          alias: string
          ciudad: string
          country_code?: string
          created_at?: string
          direccion: string
          es_principal?: boolean
          id?: string
          lat?: number | null
          lon?: number | null
          nombre_receptor?: string | null
          referencias?: string | null
          sector?: string | null
          telefono?: string | null
          user_id: string
        }
        Update: {
          alias?: string
          ciudad?: string
          country_code?: string
          created_at?: string
          direccion?: string
          es_principal?: boolean
          id?: string
          lat?: number | null
          lon?: number | null
          nombre_receptor?: string | null
          referencias?: string | null
          sector?: string | null
          telefono?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direcciones_guardadas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direcciones_guardadas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      donaciones: {
        Row: {
          created_at: string | null
          estado: string | null
          guest_email: string | null
          id: string
          mascota_id: string | null
          mensaje: string | null
          monto: number
          numero_orden: string | null
          refugio_id: string | null
          tipo: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          guest_email?: string | null
          id?: string
          mascota_id?: string | null
          mensaje?: string | null
          monto: number
          numero_orden?: string | null
          refugio_id?: string | null
          tipo?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          guest_email?: string | null
          id?: string
          mascota_id?: string | null
          mensaje?: string | null
          monto?: number
          numero_orden?: string | null
          refugio_id?: string | null
          tipo?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donaciones_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas_adopcion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donaciones_refugio_id_fkey"
            columns: ["refugio_id"]
            isOneToOne: false
            referencedRelation: "refugios"
            referencedColumns: ["id"]
          },
        ]
      }
      emergencia_eventos: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string | null
          emergencia_id: string
          id: string
          lat: number | null
          lon: number | null
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          emergencia_id: string
          id?: string
          lat?: number | null
          lon?: number | null
          tipo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          emergencia_id?: string
          id?: string
          lat?: number | null
          lon?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergencia_eventos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergencia_eventos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "emergencia_eventos_emergencia_id_fkey"
            columns: ["emergencia_id"]
            isOneToOne: false
            referencedRelation: "solicitudes_emergencia"
            referencedColumns: ["id"]
          },
        ]
      }
      empleado_invitaciones: {
        Row: {
          created_at: string
          created_by: string
          email: string
          estado: string
          expira_en: string
          id: string
          nombre: string
          prestador_id: string
          rol: string
          token: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          estado?: string
          expira_en: string
          id?: string
          nombre: string
          prestador_id: string
          rol?: string
          token?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          estado?: string
          expira_en?: string
          id?: string
          nombre?: string
          prestador_id?: string
          rol?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empleado_invitaciones_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empleado_invitaciones_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      envio_eventos: {
        Row: {
          ciudad: string | null
          descripcion: string | null
          envio_id: string
          estado: string
          fuente: string | null
          id: string
          lat: number | null
          lon: number | null
          ocurrido_en: string
        }
        Insert: {
          ciudad?: string | null
          descripcion?: string | null
          envio_id: string
          estado: string
          fuente?: string | null
          id?: string
          lat?: number | null
          lon?: number | null
          ocurrido_en?: string
        }
        Update: {
          ciudad?: string | null
          descripcion?: string | null
          envio_id?: string
          estado?: string
          fuente?: string | null
          id?: string
          lat?: number | null
          lon?: number | null
          ocurrido_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "envio_eventos_envio_id_fkey"
            columns: ["envio_id"]
            isOneToOne: false
            referencedRelation: "envios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envio_eventos_envio_id_fkey"
            columns: ["envio_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_logistico"
            referencedColumns: ["envio_id"]
          },
        ]
      }
      envios: {
        Row: {
          costo_envio: number | null
          country_code: string
          created_at: string
          destino_ciudad: string | null
          destino_direccion: string
          destino_referencia: string | null
          entrega_hora_fin: string | null
          entrega_hora_inicio: string | null
          entrega_programada: string | null
          entregado_en: string | null
          estado: string
          id: string
          intentos_entrega: number
          notas_admin: string | null
          notas_transportista: string | null
          origen_ciudad: string | null
          origen_direccion: string | null
          pagado_por: string | null
          pedido_id: string
          recogido_en: string | null
          seller_id: string | null
          tracking_code: string | null
          tracking_url: string | null
          transportista: string
          updated_at: string
        }
        Insert: {
          costo_envio?: number | null
          country_code?: string
          created_at?: string
          destino_ciudad?: string | null
          destino_direccion: string
          destino_referencia?: string | null
          entrega_hora_fin?: string | null
          entrega_hora_inicio?: string | null
          entrega_programada?: string | null
          entregado_en?: string | null
          estado?: string
          id?: string
          intentos_entrega?: number
          notas_admin?: string | null
          notas_transportista?: string | null
          origen_ciudad?: string | null
          origen_direccion?: string | null
          pagado_por?: string | null
          pedido_id: string
          recogido_en?: string | null
          seller_id?: string | null
          tracking_code?: string | null
          tracking_url?: string | null
          transportista: string
          updated_at?: string
        }
        Update: {
          costo_envio?: number | null
          country_code?: string
          created_at?: string
          destino_ciudad?: string | null
          destino_direccion?: string
          destino_referencia?: string | null
          entrega_hora_fin?: string | null
          entrega_hora_inicio?: string | null
          entrega_programada?: string | null
          entregado_en?: string | null
          estado?: string
          id?: string
          intentos_entrega?: number
          notas_admin?: string | null
          notas_transportista?: string | null
          origen_ciudad?: string | null
          origen_direccion?: string | null
          pagado_por?: string | null
          pedido_id?: string
          recogido_en?: string | null
          seller_id?: string | null
          tracking_code?: string | null
          tracking_url?: string | null
          transportista?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "envios_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envios_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_logistico"
            referencedColumns: ["pedido_id"]
          },
          {
            foreignKeyName: "envios_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envios_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      estadias: {
        Row: {
          cantidad_noches: number
          completado_en: string | null
          confirmado_en: string | null
          country_code: string
          created_at: string
          empleado_id: string | null
          estado: string
          estado_pago: string
          fecha_entrada: string
          fecha_salida: string
          hora_entrada: string | null
          hora_salida: string | null
          id: string
          mascota_id: string
          notas_prestador: string | null
          observaciones_cliente: string | null
          precio_por_noche: number
          precio_total: number
          prestador_id: string
          tipo_servicio: string
          user_id: string
        }
        Insert: {
          cantidad_noches: number
          completado_en?: string | null
          confirmado_en?: string | null
          country_code?: string
          created_at?: string
          empleado_id?: string | null
          estado?: string
          estado_pago?: string
          fecha_entrada: string
          fecha_salida: string
          hora_entrada?: string | null
          hora_salida?: string | null
          id?: string
          mascota_id: string
          notas_prestador?: string | null
          observaciones_cliente?: string | null
          precio_por_noche: number
          precio_total: number
          prestador_id: string
          tipo_servicio?: string
          user_id: string
        }
        Update: {
          cantidad_noches?: number
          completado_en?: string | null
          confirmado_en?: string | null
          country_code?: string
          created_at?: string
          empleado_id?: string | null
          estado?: string
          estado_pago?: string
          fecha_entrada?: string
          fecha_salida?: string
          hora_entrada?: string | null
          hora_salida?: string | null
          id?: string
          mascota_id?: string
          notas_prestador?: string | null
          observaciones_cliente?: string | null
          precio_por_noche?: number
          precio_total?: number
          prestador_id?: string
          tipo_servicio?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estadias_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estadias_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estadias_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estadias_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_alergia_diagnosticada: {
        Row: {
          alergeno: string
          caso_clinico_id: string | null
          categoria_alergeno: string | null
          country_code: string
          created_at: string
          empleado_id: string | null
          estado: string
          evento_id: string
          fecha_diagnostico: string
          id: string
          manejo_recomendado: string | null
          mascota_id: string
          metodo_diagnostico: string | null
          prestador_id: string | null
          reaccion_descripcion: string | null
          resuelta_en: string | null
          resuelta_motivo: string | null
          severidad: string
          updated_at: string
        }
        Insert: {
          alergeno: string
          caso_clinico_id?: string | null
          categoria_alergeno?: string | null
          country_code: string
          created_at?: string
          empleado_id?: string | null
          estado?: string
          evento_id: string
          fecha_diagnostico: string
          id?: string
          manejo_recomendado?: string | null
          mascota_id: string
          metodo_diagnostico?: string | null
          prestador_id?: string | null
          reaccion_descripcion?: string | null
          resuelta_en?: string | null
          resuelta_motivo?: string | null
          severidad: string
          updated_at?: string
        }
        Update: {
          alergeno?: string
          caso_clinico_id?: string | null
          categoria_alergeno?: string | null
          country_code?: string
          created_at?: string
          empleado_id?: string | null
          estado?: string
          evento_id?: string
          fecha_diagnostico?: string
          id?: string
          manejo_recomendado?: string | null
          mascota_id?: string
          metodo_diagnostico?: string | null
          prestador_id?: string | null
          reaccion_descripcion?: string | null
          resuelta_en?: string | null
          resuelta_motivo?: string | null
          severidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_alergia_diagnosticada_caso_clinico_id_fkey"
            columns: ["caso_clinico_id"]
            isOneToOne: false
            referencedRelation: "caso_clinico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_alergia_diagnosticada_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_alergia_diagnosticada_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_alergia_diagnosticada_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_alergia_diagnosticada_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_alergia_diagnosticada_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_archivo_adjunto: {
        Row: {
          bucket: string
          categoria: string
          country_code: string
          created_at: string
          descripcion: string | null
          empleado_id: string | null
          evento_id: string | null
          evento_padre_id: string
          id: string
          mascota_id: string
          mime_type: string | null
          nombre_archivo: string
          orden: number
          prestador_id: string
          storage_path: string
          subido_por_user_id: string
          tamano_bytes: number | null
          updated_at: string
        }
        Insert: {
          bucket: string
          categoria?: string
          country_code: string
          created_at?: string
          descripcion?: string | null
          empleado_id?: string | null
          evento_id?: string | null
          evento_padre_id: string
          id?: string
          mascota_id: string
          mime_type?: string | null
          nombre_archivo: string
          orden?: number
          prestador_id: string
          storage_path: string
          subido_por_user_id: string
          tamano_bytes?: number | null
          updated_at?: string
        }
        Update: {
          bucket?: string
          categoria?: string
          country_code?: string
          created_at?: string
          descripcion?: string | null
          empleado_id?: string | null
          evento_id?: string | null
          evento_padre_id?: string
          id?: string
          mascota_id?: string
          mime_type?: string | null
          nombre_archivo?: string
          orden?: number
          prestador_id?: string
          storage_path?: string
          subido_por_user_id?: string
          tamano_bytes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_archivo_adjunto_categoria_fk"
            columns: ["categoria"]
            isOneToOne: false
            referencedRelation: "cat_categorias_archivo"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "evento_archivo_adjunto_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_archivo_adjunto_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_archivo_adjunto_evento_padre_id_fkey"
            columns: ["evento_padre_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_archivo_adjunto_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_archivo_adjunto_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_archivo_adjunto_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_atencion: {
        Row: {
          cerrada_en: string | null
          cita_id: string
          country_code: string
          created_at: string
          empleado_id: string | null
          estado: string
          evento_id: string
          familia: string
          id: string
          iniciada_en: string
          mascota_id: string
          mensaje_familia: string | null
          prestador_id: string
          terminada_en: string | null
          updated_at: string
        }
        Insert: {
          cerrada_en?: string | null
          cita_id: string
          country_code: string
          created_at?: string
          empleado_id?: string | null
          estado?: string
          evento_id: string
          familia: string
          id?: string
          iniciada_en?: string
          mascota_id: string
          mensaje_familia?: string | null
          prestador_id: string
          terminada_en?: string | null
          updated_at?: string
        }
        Update: {
          cerrada_en?: string | null
          cita_id?: string
          country_code?: string
          created_at?: string
          empleado_id?: string | null
          estado?: string
          evento_id?: string
          familia?: string
          id?: string
          iniciada_en?: string
          mascota_id?: string
          mensaje_familia?: string | null
          prestador_id?: string
          terminada_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_atencion_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "evento_cita_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_atencion_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_atencion_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_atencion_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_atencion_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_atencion_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_cambio_nombre: {
        Row: {
          country_code: string
          created_at: string
          evento_id: string
          fecha_cambio: string
          id: string
          mascota_id: string
          motivo: string | null
          nombre_anterior: string
          nombre_nuevo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          country_code: string
          created_at?: string
          evento_id: string
          fecha_cambio: string
          id?: string
          mascota_id: string
          motivo?: string | null
          nombre_anterior: string
          nombre_nuevo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          country_code?: string
          created_at?: string
          evento_id?: string
          fecha_cambio?: string
          id?: string
          mascota_id?: string
          motivo?: string | null
          nombre_anterior?: string
          nombre_nuevo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_cambio_nombre_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_cambio_nombre_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_cambio_nombre_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_cambio_nombre_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      evento_certificado_emitido: {
        Row: {
          archivo_url: string | null
          country_code: string
          created_at: string
          destino_pais: string | null
          empleado_id: string | null
          estado: string
          evento_id: string
          fecha_emision: string
          fecha_vencimiento: string | null
          id: string
          mascota_id: string
          numero_certificado: string | null
          prestador_id: string
          proposito: string | null
          renovacion_de_id: string | null
          revocado_en: string | null
          revocado_motivo: string | null
          tipo_certificado: string
          updated_at: string
        }
        Insert: {
          archivo_url?: string | null
          country_code: string
          created_at?: string
          destino_pais?: string | null
          empleado_id?: string | null
          estado?: string
          evento_id: string
          fecha_emision: string
          fecha_vencimiento?: string | null
          id?: string
          mascota_id: string
          numero_certificado?: string | null
          prestador_id: string
          proposito?: string | null
          renovacion_de_id?: string | null
          revocado_en?: string | null
          revocado_motivo?: string | null
          tipo_certificado: string
          updated_at?: string
        }
        Update: {
          archivo_url?: string | null
          country_code?: string
          created_at?: string
          destino_pais?: string | null
          empleado_id?: string | null
          estado?: string
          evento_id?: string
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          mascota_id?: string
          numero_certificado?: string | null
          prestador_id?: string
          proposito?: string | null
          renovacion_de_id?: string | null
          revocado_en?: string | null
          revocado_motivo?: string | null
          tipo_certificado?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_certificado_emitido_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_certificado_emitido_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_certificado_emitido_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_certificado_emitido_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_certificado_emitido_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_certificado_emitido_renovacion_de_id_fkey"
            columns: ["renovacion_de_id"]
            isOneToOne: false
            referencedRelation: "evento_certificado_emitido"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_cita_servicio: {
        Row: {
          bono_id: string | null
          calificacion: number | null
          calificacion_comentario: string | null
          calificacion_en: string | null
          country_code: string
          created_at: string | null
          duracion_minutos: number
          empleado_id: string | null
          estado: string | null
          estado_reserva: string | null
          evento_id: string | null
          expira_en: string | null
          fecha: string | null
          guest_email: string | null
          hora: string | null
          id: string
          mascota_id: string | null
          metadata: Json | null
          modalidad: string
          motivo: string | null
          notas_prestador: string | null
          precio: number | null
          prestador_id: string | null
          suscripcion_servicio_id: string | null
          tipo_servicio: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bono_id?: string | null
          calificacion?: number | null
          calificacion_comentario?: string | null
          calificacion_en?: string | null
          country_code?: string
          created_at?: string | null
          duracion_minutos?: number
          empleado_id?: string | null
          estado?: string | null
          estado_reserva?: string | null
          evento_id?: string | null
          expira_en?: string | null
          fecha?: string | null
          guest_email?: string | null
          hora?: string | null
          id?: string
          mascota_id?: string | null
          metadata?: Json | null
          modalidad?: string
          motivo?: string | null
          notas_prestador?: string | null
          precio?: number | null
          prestador_id?: string | null
          suscripcion_servicio_id?: string | null
          tipo_servicio?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bono_id?: string | null
          calificacion?: number | null
          calificacion_comentario?: string | null
          calificacion_en?: string | null
          country_code?: string
          created_at?: string | null
          duracion_minutos?: number
          empleado_id?: string | null
          estado?: string | null
          estado_reserva?: string | null
          evento_id?: string | null
          expira_en?: string | null
          fecha?: string | null
          guest_email?: string | null
          hora?: string | null
          id?: string
          mascota_id?: string | null
          metadata?: Json | null
          modalidad?: string
          motivo?: string | null
          notas_prestador?: string | null
          precio?: number | null
          prestador_id?: string | null
          suscripcion_servicio_id?: string | null
          tipo_servicio?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_cita_servicio_bono_id_fkey"
            columns: ["bono_id"]
            isOneToOne: false
            referencedRelation: "bonos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_cita_servicio_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_cita_servicio_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_cita_servicio_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_cita_servicio_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_cita_servicio_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_cita_servicio_suscripcion_id_fkey"
            columns: ["suscripcion_servicio_id"]
            isOneToOne: false
            referencedRelation: "suscripciones_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_cita_servicio_tipo_servicio_fk"
            columns: ["tipo_servicio"]
            isOneToOne: false
            referencedRelation: "tipos_servicio"
            referencedColumns: ["codigo"]
          },
        ]
      }
      evento_condicion_cronica_diagnosticada: {
        Row: {
          caso_clinico_id: string | null
          cie_codigo: string | null
          condicion: string
          country_code: string
          created_at: string
          diagnostico_descripcion: string | null
          empleado_id: string | null
          estado: string
          evento_id: string
          fecha_diagnostico: string
          id: string
          manejo_actual: string | null
          mascota_id: string
          prestador_id: string | null
          remitida_en: string | null
          remitida_motivo: string | null
          seguimiento_recomendado: string | null
          updated_at: string
        }
        Insert: {
          caso_clinico_id?: string | null
          cie_codigo?: string | null
          condicion: string
          country_code: string
          created_at?: string
          diagnostico_descripcion?: string | null
          empleado_id?: string | null
          estado?: string
          evento_id: string
          fecha_diagnostico: string
          id?: string
          manejo_actual?: string | null
          mascota_id: string
          prestador_id?: string | null
          remitida_en?: string | null
          remitida_motivo?: string | null
          seguimiento_recomendado?: string | null
          updated_at?: string
        }
        Update: {
          caso_clinico_id?: string | null
          cie_codigo?: string | null
          condicion?: string
          country_code?: string
          created_at?: string
          diagnostico_descripcion?: string | null
          empleado_id?: string | null
          estado?: string
          evento_id?: string
          fecha_diagnostico?: string
          id?: string
          manejo_actual?: string | null
          mascota_id?: string
          prestador_id?: string | null
          remitida_en?: string | null
          remitida_motivo?: string | null
          seguimiento_recomendado?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_condicion_cronica_diagnosticada_caso_clinico_id_fkey"
            columns: ["caso_clinico_id"]
            isOneToOne: false
            referencedRelation: "caso_clinico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_condicion_cronica_diagnosticada_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_condicion_cronica_diagnosticada_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_condicion_cronica_diagnosticada_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_condicion_cronica_diagnosticada_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_condicion_cronica_diagnosticada_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_correccion_dato_identidad: {
        Row: {
          campo_corregido: string
          country_code: string
          created_at: string
          evento_id: string
          fecha_correccion: string
          id: string
          mascota_id: string
          motivo: string
          updated_at: string
          user_id: string
          valor_anterior: string | null
          valor_nuevo: string
        }
        Insert: {
          campo_corregido: string
          country_code: string
          created_at?: string
          evento_id: string
          fecha_correccion: string
          id?: string
          mascota_id: string
          motivo: string
          updated_at?: string
          user_id: string
          valor_anterior?: string | null
          valor_nuevo: string
        }
        Update: {
          campo_corregido?: string
          country_code?: string
          created_at?: string
          evento_id?: string
          fecha_correccion?: string
          id?: string
          mascota_id?: string
          motivo?: string
          updated_at?: string
          user_id?: string
          valor_anterior?: string | null
          valor_nuevo?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_correccion_dato_identidad_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_correccion_dato_identidad_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_correccion_dato_identidad_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_correccion_dato_identidad_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      evento_emergencia_solicitada: {
        Row: {
          cita_resultante_id: string | null
          country_code: string
          created_at: string
          descripcion_situacion: string
          empleado_asignado_id: string | null
          estado: string
          evento_id: string
          fecha_asignacion: string | null
          fecha_resolucion: string | null
          fecha_solicitud: string
          id: string
          mascota_id: string
          prestador_asignado_id: string | null
          resolucion_descripcion: string | null
          ubicacion_direccion: string | null
          ubicacion_lat: number | null
          ubicacion_lon: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cita_resultante_id?: string | null
          country_code: string
          created_at?: string
          descripcion_situacion: string
          empleado_asignado_id?: string | null
          estado?: string
          evento_id: string
          fecha_asignacion?: string | null
          fecha_resolucion?: string | null
          fecha_solicitud: string
          id?: string
          mascota_id: string
          prestador_asignado_id?: string | null
          resolucion_descripcion?: string | null
          ubicacion_direccion?: string | null
          ubicacion_lat?: number | null
          ubicacion_lon?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cita_resultante_id?: string | null
          country_code?: string
          created_at?: string
          descripcion_situacion?: string
          empleado_asignado_id?: string | null
          estado?: string
          evento_id?: string
          fecha_asignacion?: string | null
          fecha_resolucion?: string | null
          fecha_solicitud?: string
          id?: string
          mascota_id?: string
          prestador_asignado_id?: string | null
          resolucion_descripcion?: string | null
          ubicacion_direccion?: string | null
          ubicacion_lat?: number | null
          ubicacion_lon?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_emergencia_solicitada_cita_resultante_id_fkey"
            columns: ["cita_resultante_id"]
            isOneToOne: false
            referencedRelation: "evento_cita_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_emergencia_solicitada_empleado_asignado_id_fkey"
            columns: ["empleado_asignado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_emergencia_solicitada_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_emergencia_solicitada_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_emergencia_solicitada_prestador_asignado_id_fkey"
            columns: ["prestador_asignado_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_emergencia_solicitada_prestador_asignado_id_fkey"
            columns: ["prestador_asignado_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_emergencia_solicitada_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_emergencia_solicitada_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      evento_examen_diagnostico: {
        Row: {
          archivo_resultado_path: string | null
          caso_clinico_id: string | null
          cita_id: string | null
          country_code: string
          created_at: string
          descripcion: string | null
          empleado_id: string | null
          estado: string
          evento_id: string | null
          id: string
          indicaciones_preparacion: string | null
          mascota_id: string
          orden: number
          prestador_id: string
          resultado_recibido_en: string | null
          resultado_texto: string | null
          tipo_examen: string
          updated_at: string
          urgencia: string
        }
        Insert: {
          archivo_resultado_path?: string | null
          caso_clinico_id?: string | null
          cita_id?: string | null
          country_code: string
          created_at?: string
          descripcion?: string | null
          empleado_id?: string | null
          estado?: string
          evento_id?: string | null
          id?: string
          indicaciones_preparacion?: string | null
          mascota_id: string
          orden?: number
          prestador_id: string
          resultado_recibido_en?: string | null
          resultado_texto?: string | null
          tipo_examen: string
          updated_at?: string
          urgencia?: string
        }
        Update: {
          archivo_resultado_path?: string | null
          caso_clinico_id?: string | null
          cita_id?: string | null
          country_code?: string
          created_at?: string
          descripcion?: string | null
          empleado_id?: string | null
          estado?: string
          evento_id?: string | null
          id?: string
          indicaciones_preparacion?: string | null
          mascota_id?: string
          orden?: number
          prestador_id?: string
          resultado_recibido_en?: string | null
          resultado_texto?: string | null
          tipo_examen?: string
          updated_at?: string
          urgencia?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_examen_diagnostico_caso_clinico_id_fkey"
            columns: ["caso_clinico_id"]
            isOneToOne: false
            referencedRelation: "caso_clinico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_examen_diagnostico_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "evento_cita_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_examen_diagnostico_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_examen_diagnostico_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_examen_diagnostico_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_examen_diagnostico_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_examen_diagnostico_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_grooming_archivos: {
        Row: {
          country_code: string
          created_at: string
          descripcion: string | null
          grooming_id: string
          id: string
          mascota_id: string
          orden: number
          prestador_id: string
          storage_path: string
          tipo: string
        }
        Insert: {
          country_code: string
          created_at?: string
          descripcion?: string | null
          grooming_id: string
          id?: string
          mascota_id: string
          orden?: number
          prestador_id: string
          storage_path: string
          tipo: string
        }
        Update: {
          country_code?: string
          created_at?: string
          descripcion?: string | null
          grooming_id?: string
          id?: string
          mascota_id?: string
          orden?: number
          prestador_id?: string
          storage_path?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_grooming_archivos_grooming_id_fkey"
            columns: ["grooming_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota_grooming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_archivos_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_archivos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_archivos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_grooming_estados_pelaje: {
        Row: {
          country_code: string
          created_at: string
          estado_codigo: string
          grooming_id: string
          id: string
          mascota_id: string
          momento: string
          nota: string | null
          prestador_id: string
        }
        Insert: {
          country_code: string
          created_at?: string
          estado_codigo: string
          grooming_id: string
          id?: string
          mascota_id: string
          momento: string
          nota?: string | null
          prestador_id: string
        }
        Update: {
          country_code?: string
          created_at?: string
          estado_codigo?: string
          grooming_id?: string
          id?: string
          mascota_id?: string
          momento?: string
          nota?: string | null
          prestador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_grooming_estados_pelaje_estado_codigo_fkey"
            columns: ["estado_codigo"]
            isOneToOne: false
            referencedRelation: "cat_estados_pelaje"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "evento_grooming_estados_pelaje_grooming_id_fkey"
            columns: ["grooming_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota_grooming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_estados_pelaje_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_estados_pelaje_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_estados_pelaje_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_grooming_incidencias: {
        Row: {
          country_code: string
          created_at: string
          descripcion: string | null
          evento_atencion_id: string
          grooming_id: string | null
          id: string
          incidencia_codigo: string
          mascota_id: string
          orden: number
          prestador_id: string
          severidad: string | null
        }
        Insert: {
          country_code: string
          created_at?: string
          descripcion?: string | null
          evento_atencion_id: string
          grooming_id?: string | null
          id?: string
          incidencia_codigo: string
          mascota_id: string
          orden?: number
          prestador_id: string
          severidad?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string
          descripcion?: string | null
          evento_atencion_id?: string
          grooming_id?: string | null
          id?: string
          incidencia_codigo?: string
          mascota_id?: string
          orden?: number
          prestador_id?: string
          severidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_grooming_incidencias_evento_atencion_id_fkey"
            columns: ["evento_atencion_id"]
            isOneToOne: false
            referencedRelation: "evento_atencion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_incidencias_grooming_id_fkey"
            columns: ["grooming_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota_grooming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_incidencias_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_incidencias_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_incidencias_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_grooming_notas: {
        Row: {
          categoria: string | null
          country_code: string
          created_at: string
          evento_atencion_id: string
          grooming_id: string | null
          id: string
          mascota_id: string
          orden: number
          prestador_id: string
          texto: string
          via: string
        }
        Insert: {
          categoria?: string | null
          country_code: string
          created_at?: string
          evento_atencion_id: string
          grooming_id?: string | null
          id?: string
          mascota_id: string
          orden?: number
          prestador_id: string
          texto: string
          via?: string
        }
        Update: {
          categoria?: string | null
          country_code?: string
          created_at?: string
          evento_atencion_id?: string
          grooming_id?: string | null
          id?: string
          mascota_id?: string
          orden?: number
          prestador_id?: string
          texto?: string
          via?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_grooming_notas_evento_atencion_id_fkey"
            columns: ["evento_atencion_id"]
            isOneToOne: false
            referencedRelation: "evento_atencion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_notas_grooming_id_fkey"
            columns: ["grooming_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota_grooming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_notas_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_notas_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_notas_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_grooming_pausas: {
        Row: {
          country_code: string
          created_at: string
          evento_atencion_id: string
          grooming_id: string | null
          id: string
          mascota_id: string
          orden: number
          pausada_en: string
          prestador_id: string
          reanudada_en: string | null
        }
        Insert: {
          country_code: string
          created_at?: string
          evento_atencion_id: string
          grooming_id?: string | null
          id?: string
          mascota_id: string
          orden?: number
          pausada_en?: string
          prestador_id: string
          reanudada_en?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string
          evento_atencion_id?: string
          grooming_id?: string | null
          id?: string
          mascota_id?: string
          orden?: number
          pausada_en?: string
          prestador_id?: string
          reanudada_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_grooming_pausas_evento_atencion_id_fkey"
            columns: ["evento_atencion_id"]
            isOneToOne: false
            referencedRelation: "evento_atencion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_pausas_grooming_id_fkey"
            columns: ["grooming_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota_grooming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_pausas_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_pausas_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_pausas_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_grooming_productos_consumidos: {
        Row: {
          cantidad: number | null
          country_code: string
          created_at: string
          grooming_id: string
          id: string
          mascota_id: string
          nota: string | null
          orden: number
          prestador_id: string
          producto_codigo: string | null
          producto_otro: string | null
          unidad: string | null
        }
        Insert: {
          cantidad?: number | null
          country_code: string
          created_at?: string
          grooming_id: string
          id?: string
          mascota_id: string
          nota?: string | null
          orden?: number
          prestador_id: string
          producto_codigo?: string | null
          producto_otro?: string | null
          unidad?: string | null
        }
        Update: {
          cantidad?: number | null
          country_code?: string
          created_at?: string
          grooming_id?: string
          id?: string
          mascota_id?: string
          nota?: string | null
          orden?: number
          prestador_id?: string
          producto_codigo?: string | null
          producto_otro?: string | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_grooming_productos_consumidos_grooming_id_fkey"
            columns: ["grooming_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota_grooming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_productos_consumidos_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_productos_consumidos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_productos_consumidos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_productos_consumidos_producto_codigo_fkey"
            columns: ["producto_codigo"]
            isOneToOne: false
            referencedRelation: "cat_productos_oficio"
            referencedColumns: ["codigo"]
          },
        ]
      }
      evento_grooming_servicios_aplicados: {
        Row: {
          country_code: string
          created_at: string
          grooming_id: string
          id: string
          mascota_id: string
          nota: string | null
          orden: number
          prestador_id: string
          servicio_codigo: string
        }
        Insert: {
          country_code: string
          created_at?: string
          grooming_id: string
          id?: string
          mascota_id: string
          nota?: string | null
          orden?: number
          prestador_id: string
          servicio_codigo: string
        }
        Update: {
          country_code?: string
          created_at?: string
          grooming_id?: string
          id?: string
          mascota_id?: string
          nota?: string | null
          orden?: number
          prestador_id?: string
          servicio_codigo?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_grooming_servicios_aplicados_grooming_id_fkey"
            columns: ["grooming_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota_grooming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_servicios_aplicados_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_servicios_aplicados_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_servicios_aplicados_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_servicios_aplicados_servicio_codigo_fkey"
            columns: ["servicio_codigo"]
            isOneToOne: false
            referencedRelation: "cat_servicios_grooming"
            referencedColumns: ["codigo"]
          },
        ]
      }
      evento_grooming_zonas_trabajadas: {
        Row: {
          country_code: string
          created_at: string
          grooming_id: string
          id: string
          mascota_id: string
          nota: string | null
          orden: number
          prestador_id: string
          zona_codigo: string
        }
        Insert: {
          country_code: string
          created_at?: string
          grooming_id: string
          id?: string
          mascota_id: string
          nota?: string | null
          orden?: number
          prestador_id: string
          zona_codigo: string
        }
        Update: {
          country_code?: string
          created_at?: string
          grooming_id?: string
          id?: string
          mascota_id?: string
          nota?: string | null
          orden?: number
          prestador_id?: string
          zona_codigo?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_grooming_zonas_trabajadas_grooming_id_fkey"
            columns: ["grooming_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota_grooming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_zonas_trabajadas_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_zonas_trabajadas_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_zonas_trabajadas_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_grooming_zonas_trabajadas_zona_codigo_fkey"
            columns: ["zona_codigo"]
            isOneToOne: false
            referencedRelation: "cat_zonas_trabajo_grooming"
            referencedColumns: ["codigo"]
          },
        ]
      }
      evento_historia_clinica_registrada: {
        Row: {
          anamnesis: string | null
          caso_clinico_id: string | null
          cie_codigo: string | null
          cita_id: string
          completado_en: string
          condicion_corporal: number | null
          country_code: string
          diagnostico_principal: string
          diagnosticos_secundarios: Json
          empleado_id: string | null
          evento_id: string | null
          examen_fisico: string | null
          frecuencia_cardiaca: number | null
          frecuencia_respiratoria: number | null
          id: string
          indicaciones: string | null
          mascota_id: string
          motivo_consulta: string
          peso_kg: number | null
          prestador_id: string
          requiere_cirugia: boolean | null
          requiere_hospitalizacion: boolean | null
          temperatura_c: number | null
          tratamiento: string | null
          updated_at: string
          veterinario_user_id: string
        }
        Insert: {
          anamnesis?: string | null
          caso_clinico_id?: string | null
          cie_codigo?: string | null
          cita_id: string
          completado_en?: string
          condicion_corporal?: number | null
          country_code?: string
          diagnostico_principal: string
          diagnosticos_secundarios?: Json
          empleado_id?: string | null
          evento_id?: string | null
          examen_fisico?: string | null
          frecuencia_cardiaca?: number | null
          frecuencia_respiratoria?: number | null
          id?: string
          indicaciones?: string | null
          mascota_id: string
          motivo_consulta: string
          peso_kg?: number | null
          prestador_id: string
          requiere_cirugia?: boolean | null
          requiere_hospitalizacion?: boolean | null
          temperatura_c?: number | null
          tratamiento?: string | null
          updated_at?: string
          veterinario_user_id: string
        }
        Update: {
          anamnesis?: string | null
          caso_clinico_id?: string | null
          cie_codigo?: string | null
          cita_id?: string
          completado_en?: string
          condicion_corporal?: number | null
          country_code?: string
          diagnostico_principal?: string
          diagnosticos_secundarios?: Json
          empleado_id?: string | null
          evento_id?: string | null
          examen_fisico?: string | null
          frecuencia_cardiaca?: number | null
          frecuencia_respiratoria?: number | null
          id?: string
          indicaciones?: string | null
          mascota_id?: string
          motivo_consulta?: string
          peso_kg?: number | null
          prestador_id?: string
          requiere_cirugia?: boolean | null
          requiere_hospitalizacion?: boolean | null
          temperatura_c?: number | null
          tratamiento?: string | null
          updated_at?: string
          veterinario_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_historia_clinica_registrada_caso_clinico_id_fkey"
            columns: ["caso_clinico_id"]
            isOneToOne: false
            referencedRelation: "caso_clinico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_historia_clinica_registrada_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: true
            referencedRelation: "evento_cita_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_historia_clinica_registrada_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_historia_clinica_registrada_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_historia_clinica_registrada_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_historia_clinica_registrada_veterinario_user_id_fkey"
            columns: ["veterinario_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_historia_clinica_registrada_veterinario_user_id_fkey"
            columns: ["veterinario_user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "historia_clinica_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historia_clinica_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_identidad_personal: {
        Row: {
          activo: boolean
          contribuido_por_familia_miembro_id: string | null
          created_at: string
          desactivado_en: string | null
          desactivado_motivo: string | null
          desactivado_por_user_id: string | null
          descripcion: string | null
          evento_id: string
          mascota_id: string
          relevante_para: string[]
          subtipo: string
          titulo_corto: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          contribuido_por_familia_miembro_id?: string | null
          created_at?: string
          desactivado_en?: string | null
          desactivado_motivo?: string | null
          desactivado_por_user_id?: string | null
          descripcion?: string | null
          evento_id: string
          mascota_id: string
          relevante_para?: string[]
          subtipo: string
          titulo_corto: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          contribuido_por_familia_miembro_id?: string | null
          created_at?: string
          desactivado_en?: string | null
          desactivado_motivo?: string | null
          desactivado_por_user_id?: string | null
          descripcion?: string | null
          evento_id?: string
          mascota_id?: string
          relevante_para?: string[]
          subtipo?: string
          titulo_corto?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_identidad_personal_contribuido_por_familia_miembro__fkey"
            columns: ["contribuido_por_familia_miembro_id"]
            isOneToOne: false
            referencedRelation: "familia_miembro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_identidad_personal_desactivado_por_user_id_fkey"
            columns: ["desactivado_por_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_identidad_personal_desactivado_por_user_id_fkey"
            columns: ["desactivado_por_user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "evento_identidad_personal_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_identidad_personal_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_inscripciones: {
        Row: {
          codigo_entrada: string | null
          created_at: string
          estado: string
          evento_id: string
          id: string
          mascota_id: string | null
          monto_pagado: number | null
          notas: string | null
          pagado: boolean | null
          pedido_id: string | null
          user_id: string
        }
        Insert: {
          codigo_entrada?: string | null
          created_at?: string
          estado?: string
          evento_id: string
          id?: string
          mascota_id?: string | null
          monto_pagado?: number | null
          notas?: string | null
          pagado?: boolean | null
          pedido_id?: string | null
          user_id: string
        }
        Update: {
          codigo_entrada?: string | null
          created_at?: string
          estado?: string
          evento_id?: string
          id?: string
          mascota_id?: string | null
          monto_pagado?: number | null
          notas?: string | null
          pagado?: boolean | null
          pedido_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_inscripciones_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_inscripciones_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_inscripciones_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_inscripciones_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_logistico"
            referencedColumns: ["pedido_id"]
          },
          {
            foreignKeyName: "evento_inscripciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_inscripciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      evento_intervencion_permanente: {
        Row: {
          caso_clinico_id: string | null
          country_code: string
          created_at: string
          descripcion: string | null
          empleado_id: string | null
          evento_id: string
          fecha_realizada: string
          id: string
          mascota_id: string
          notas: string | null
          prestador_id: string | null
          reversible: boolean
          tipo_intervencion: string
          updated_at: string
        }
        Insert: {
          caso_clinico_id?: string | null
          country_code: string
          created_at?: string
          descripcion?: string | null
          empleado_id?: string | null
          evento_id: string
          fecha_realizada: string
          id?: string
          mascota_id: string
          notas?: string | null
          prestador_id?: string | null
          reversible?: boolean
          tipo_intervencion: string
          updated_at?: string
        }
        Update: {
          caso_clinico_id?: string | null
          country_code?: string
          created_at?: string
          descripcion?: string | null
          empleado_id?: string | null
          evento_id?: string
          fecha_realizada?: string
          id?: string
          mascota_id?: string
          notas?: string | null
          prestador_id?: string | null
          reversible?: boolean
          tipo_intervencion?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_intervencion_permanente_caso_clinico_id_fkey"
            columns: ["caso_clinico_id"]
            isOneToOne: false
            referencedRelation: "caso_clinico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_intervencion_permanente_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_intervencion_permanente_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_intervencion_permanente_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_intervencion_permanente_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_intervencion_permanente_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_medicacion_administrada: {
        Row: {
          country_code: string
          created_at: string
          dosis_administrada: string
          empleado_id: string | null
          evento_id: string
          fecha_administracion: string
          id: string
          mascota_id: string
          nombre_medicamento: string
          notas: string | null
          prescripcion_id: string | null
          prestador_id: string | null
          principio_activo: string | null
          updated_at: string
          via_administracion: string
        }
        Insert: {
          country_code: string
          created_at?: string
          dosis_administrada: string
          empleado_id?: string | null
          evento_id: string
          fecha_administracion: string
          id?: string
          mascota_id: string
          nombre_medicamento: string
          notas?: string | null
          prescripcion_id?: string | null
          prestador_id?: string | null
          principio_activo?: string | null
          updated_at?: string
          via_administracion: string
        }
        Update: {
          country_code?: string
          created_at?: string
          dosis_administrada?: string
          empleado_id?: string | null
          evento_id?: string
          fecha_administracion?: string
          id?: string
          mascota_id?: string
          nombre_medicamento?: string
          notas?: string | null
          prescripcion_id?: string | null
          prestador_id?: string | null
          principio_activo?: string | null
          updated_at?: string
          via_administracion?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_medicacion_administrada_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_medicacion_administrada_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_medicacion_administrada_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_medicacion_administrada_prescripcion_id_fkey"
            columns: ["prescripcion_id"]
            isOneToOne: false
            referencedRelation: "evento_medicacion_prescrita"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_medicacion_administrada_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_medicacion_administrada_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_medicacion_prescrita: {
        Row: {
          caso_clinico_id: string | null
          cita_id: string | null
          concentracion: string | null
          country_code: string
          created_at: string
          dosis: string
          duracion_dias: number | null
          empleado_id: string | null
          evento_id: string | null
          fecha_fin_estimada: string | null
          fecha_inicio: string | null
          forma_farmaceutica: string | null
          frecuencia: string
          id: string
          indicaciones_especiales: string | null
          mascota_id: string
          nombre_medicamento: string
          orden: number
          prestador_id: string
          principio_activo: string | null
          updated_at: string
          via_administracion: string | null
        }
        Insert: {
          caso_clinico_id?: string | null
          cita_id?: string | null
          concentracion?: string | null
          country_code: string
          created_at?: string
          dosis: string
          duracion_dias?: number | null
          empleado_id?: string | null
          evento_id?: string | null
          fecha_fin_estimada?: string | null
          fecha_inicio?: string | null
          forma_farmaceutica?: string | null
          frecuencia: string
          id?: string
          indicaciones_especiales?: string | null
          mascota_id: string
          nombre_medicamento: string
          orden?: number
          prestador_id: string
          principio_activo?: string | null
          updated_at?: string
          via_administracion?: string | null
        }
        Update: {
          caso_clinico_id?: string | null
          cita_id?: string | null
          concentracion?: string | null
          country_code?: string
          created_at?: string
          dosis?: string
          duracion_dias?: number | null
          empleado_id?: string | null
          evento_id?: string | null
          fecha_fin_estimada?: string | null
          fecha_inicio?: string | null
          forma_farmaceutica?: string | null
          frecuencia?: string
          id?: string
          indicaciones_especiales?: string | null
          mascota_id?: string
          nombre_medicamento?: string
          orden?: number
          prestador_id?: string
          principio_activo?: string | null
          updated_at?: string
          via_administracion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cita_recetas_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cita_recetas_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_medicacion_prescrita_caso_clinico_id_fkey"
            columns: ["caso_clinico_id"]
            isOneToOne: false
            referencedRelation: "caso_clinico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_medicacion_prescrita_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "evento_cita_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_medicacion_prescrita_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_medicacion_prescrita_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_medicacion_prescrita_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_microchip_asignado: {
        Row: {
          country_code: string
          created_at: string
          empleado_id: string | null
          evento_id: string
          fabricante: string | null
          fecha_implante: string
          id: string
          mascota_id: string
          microchip_id: string
          notas: string | null
          prestador_id: string | null
          ubicacion_implante: string | null
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          empleado_id?: string | null
          evento_id: string
          fabricante?: string | null
          fecha_implante: string
          id?: string
          mascota_id: string
          microchip_id: string
          notas?: string | null
          prestador_id?: string | null
          ubicacion_implante?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          empleado_id?: string | null
          evento_id?: string
          fabricante?: string | null
          fecha_implante?: string
          id?: string
          mascota_id?: string
          microchip_id?: string
          notas?: string | null
          prestador_id?: string | null
          ubicacion_implante?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_microchip_asignado_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_microchip_asignado_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_microchip_asignado_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_microchip_asignado_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_microchip_asignado_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_nota_dueno: {
        Row: {
          categoria: string
          contenido: string
          country_code: string
          created_at: string
          evento_id: string
          fecha_nota: string
          id: string
          mascota_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria: string
          contenido: string
          country_code: string
          created_at?: string
          evento_id: string
          fecha_nota: string
          id?: string
          mascota_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          contenido?: string
          country_code?: string
          created_at?: string
          evento_id?: string
          fecha_nota?: string
          id?: string
          mascota_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_nota_dueno_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_nota_dueno_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_nota_dueno_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_nota_dueno_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      evento_paseo_novedades: {
        Row: {
          country_code: string
          created_at: string
          detalle: string | null
          id: string
          mascota_id: string
          novedad_codigo: string
          paseo_id: string
          prestador_id: string
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          detalle?: string | null
          id?: string
          mascota_id: string
          novedad_codigo: string
          paseo_id: string
          prestador_id: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          detalle?: string | null
          id?: string
          mascota_id?: string
          novedad_codigo?: string
          paseo_id?: string
          prestador_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_paseo_novedades_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_paseo_novedades_novedad_codigo_fkey"
            columns: ["novedad_codigo"]
            isOneToOne: false
            referencedRelation: "cat_novedades_paseo"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "evento_paseo_novedades_paseo_id_fkey"
            columns: ["paseo_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota_paseo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_paseo_novedades_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_paseo_novedades_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_peso_medicion: {
        Row: {
          country_code: string
          created_at: string
          empleado_id: string | null
          evento_id: string
          fecha_medicion: string
          id: string
          mascota_id: string
          metodo_medicion: string
          notas: string | null
          peso_kg: number
          prestador_id: string | null
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          empleado_id?: string | null
          evento_id: string
          fecha_medicion: string
          id?: string
          mascota_id: string
          metodo_medicion: string
          notas?: string | null
          peso_kg: number
          prestador_id?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          empleado_id?: string | null
          evento_id?: string
          fecha_medicion?: string
          id?: string
          mascota_id?: string
          metodo_medicion?: string
          notas?: string | null
          peso_kg?: number
          prestador_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_peso_medicion_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_peso_medicion_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_peso_medicion_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_peso_medicion_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_peso_medicion_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_temperamento_observacion: {
        Row: {
          contexto: string
          country_code: string
          created_at: string
          descripcion: string | null
          empleado_id: string | null
          evento_id: string
          fecha_observacion: string
          id: string
          mascota_id: string
          prestador_id: string | null
          rasgos: Json
          updated_at: string
        }
        Insert: {
          contexto: string
          country_code: string
          created_at?: string
          descripcion?: string | null
          empleado_id?: string | null
          evento_id: string
          fecha_observacion: string
          id?: string
          mascota_id: string
          prestador_id?: string | null
          rasgos?: Json
          updated_at?: string
        }
        Update: {
          contexto?: string
          country_code?: string
          created_at?: string
          descripcion?: string | null
          empleado_id?: string | null
          evento_id?: string
          fecha_observacion?: string
          id?: string
          mascota_id?: string
          prestador_id?: string | null
          rasgos?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_temperamento_observacion_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_temperamento_observacion_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_temperamento_observacion_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_temperamento_observacion_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_temperamento_observacion_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_vacuna_aplicada: {
        Row: {
          archivo_url: string | null
          cita_id: string | null
          country_code: string
          created_at: string
          dosis: string | null
          empleado_id: string | null
          evento_id: string | null
          fecha_aplicada: string | null
          fecha_proxima: string | null
          id: string
          lote: string | null
          mascota_id: string
          nombre_vacuna: string
          prestador_id: string | null
          tipo_vacuna: string | null
          updated_at: string
          veterinario_nombre_externo: string | null
          via_administracion: string | null
        }
        Insert: {
          archivo_url?: string | null
          cita_id?: string | null
          country_code?: string
          created_at?: string
          dosis?: string | null
          empleado_id?: string | null
          evento_id?: string | null
          fecha_aplicada?: string | null
          fecha_proxima?: string | null
          id?: string
          lote?: string | null
          mascota_id: string
          nombre_vacuna: string
          prestador_id?: string | null
          tipo_vacuna?: string | null
          updated_at?: string
          veterinario_nombre_externo?: string | null
          via_administracion?: string | null
        }
        Update: {
          archivo_url?: string | null
          cita_id?: string | null
          country_code?: string
          created_at?: string
          dosis?: string | null
          empleado_id?: string | null
          evento_id?: string | null
          fecha_aplicada?: string | null
          fecha_proxima?: string | null
          id?: string
          lote?: string | null
          mascota_id?: string
          nombre_vacuna?: string
          prestador_id?: string | null
          tipo_vacuna?: string | null
          updated_at?: string
          veterinario_nombre_externo?: string | null
          via_administracion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_vacuna_aplicada_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "evento_cita_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_vacuna_aplicada_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_vacuna_aplicada_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_vacuna_aplicada_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_vacuna_aplicada_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_vacuna_aplicada_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          capacidad_max: number | null
          ciudad: string | null
          country_code: string
          created_at: string
          descripcion: string | null
          direccion: string | null
          es_gratuito: boolean
          especies_permitidas: Json | null
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          galeria: Json | null
          id: string
          imagen_url: string | null
          inscritos: number
          lat: number | null
          lon: number | null
          modalidad: string
          nombre: string
          notas_requisitos: string | null
          organizador_id: string
          patrocinadores: Json | null
          precio_entrada: number | null
          requiere_correa: boolean | null
          requiere_vacunas: boolean | null
          tipo: string
          updated_at: string
          url_virtual: string | null
          zona_horaria: string | null
        }
        Insert: {
          capacidad_max?: number | null
          ciudad?: string | null
          country_code?: string
          created_at?: string
          descripcion?: string | null
          direccion?: string | null
          es_gratuito?: boolean
          especies_permitidas?: Json | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio: string
          galeria?: Json | null
          id?: string
          imagen_url?: string | null
          inscritos?: number
          lat?: number | null
          lon?: number | null
          modalidad?: string
          nombre: string
          notas_requisitos?: string | null
          organizador_id: string
          patrocinadores?: Json | null
          precio_entrada?: number | null
          requiere_correa?: boolean | null
          requiere_vacunas?: boolean | null
          tipo: string
          updated_at?: string
          url_virtual?: string | null
          zona_horaria?: string | null
        }
        Update: {
          capacidad_max?: number | null
          ciudad?: string | null
          country_code?: string
          created_at?: string
          descripcion?: string | null
          direccion?: string | null
          es_gratuito?: boolean
          especies_permitidas?: Json | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          galeria?: Json | null
          id?: string
          imagen_url?: string | null
          inscritos?: number
          lat?: number | null
          lon?: number | null
          modalidad?: string
          nombre?: string
          notas_requisitos?: string | null
          organizador_id?: string
          patrocinadores?: Json | null
          precio_entrada?: number | null
          requiere_correa?: boolean | null
          requiere_vacunas?: boolean | null
          tipo?: string
          updated_at?: string
          url_virtual?: string | null
          zona_horaria?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_organizador_id_fkey"
            columns: ["organizador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_organizador_id_fkey"
            columns: ["organizador_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      eventos_economicos: {
        Row: {
          cohorte_periodo: string | null
          country_code: string
          created_at: string
          cuenta_comercial_id: string | null
          estado: Database["public"]["Enums"]["estado_evento_economico_enum"]
          evento_original_id: string | null
          fecha_cobro_kushki: string | null
          fecha_devengo: string
          fee_calculo_detalle: Json
          fee_config_id: string | null
          id: string
          kushki_charge_id: string | null
          liquidacion_id: string | null
          metadata: Json
          moneda: string
          monto_bruto: number
          monto_kushki_fee: number
          monto_payout: number | null
          monto_plataforma: number
          notas_admin: string | null
          origen_id: string
          origen_tipo: string
          parent_evento_id: string | null
          revenue_stream: Database["public"]["Enums"]["revenue_stream_enum"]
          reversado_por_evento_id: string | null
          tipo_evento: Database["public"]["Enums"]["tipo_evento_economico_enum"]
          updated_at: string
        }
        Insert: {
          cohorte_periodo?: string | null
          country_code: string
          created_at?: string
          cuenta_comercial_id?: string | null
          estado?: Database["public"]["Enums"]["estado_evento_economico_enum"]
          evento_original_id?: string | null
          fecha_cobro_kushki?: string | null
          fecha_devengo: string
          fee_calculo_detalle?: Json
          fee_config_id?: string | null
          id?: string
          kushki_charge_id?: string | null
          liquidacion_id?: string | null
          metadata?: Json
          moneda?: string
          monto_bruto: number
          monto_kushki_fee?: number
          monto_payout?: number | null
          monto_plataforma: number
          notas_admin?: string | null
          origen_id: string
          origen_tipo: string
          parent_evento_id?: string | null
          revenue_stream: Database["public"]["Enums"]["revenue_stream_enum"]
          reversado_por_evento_id?: string | null
          tipo_evento: Database["public"]["Enums"]["tipo_evento_economico_enum"]
          updated_at?: string
        }
        Update: {
          cohorte_periodo?: string | null
          country_code?: string
          created_at?: string
          cuenta_comercial_id?: string | null
          estado?: Database["public"]["Enums"]["estado_evento_economico_enum"]
          evento_original_id?: string | null
          fecha_cobro_kushki?: string | null
          fecha_devengo?: string
          fee_calculo_detalle?: Json
          fee_config_id?: string | null
          id?: string
          kushki_charge_id?: string | null
          liquidacion_id?: string | null
          metadata?: Json
          moneda?: string
          monto_bruto?: number
          monto_kushki_fee?: number
          monto_payout?: number | null
          monto_plataforma?: number
          notas_admin?: string | null
          origen_id?: string
          origen_tipo?: string
          parent_evento_id?: string | null
          revenue_stream?: Database["public"]["Enums"]["revenue_stream_enum"]
          reversado_por_evento_id?: string | null
          tipo_evento?: Database["public"]["Enums"]["tipo_evento_economico_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_economicos_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_economicos_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
          {
            foreignKeyName: "eventos_economicos_evento_original_id_fkey"
            columns: ["evento_original_id"]
            isOneToOne: false
            referencedRelation: "eventos_economicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_economicos_evento_original_id_fkey"
            columns: ["evento_original_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_con_origen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_economicos_fee_config_id_fkey"
            columns: ["fee_config_id"]
            isOneToOne: false
            referencedRelation: "fee_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_economicos_parent_evento_id_fkey"
            columns: ["parent_evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_economicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_economicos_parent_evento_id_fkey"
            columns: ["parent_evento_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_con_origen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_economicos_reversado_por_evento_id_fkey"
            columns: ["reversado_por_evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_economicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_economicos_reversado_por_evento_id_fkey"
            columns: ["reversado_por_evento_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_con_origen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_eventos_liquidacion"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "liquidaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_eventos_liquidacion"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "v_liquidaciones_pendientes_pago"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_mascota: {
        Row: {
          country_code: string
          creado_por_sistema: string | null
          creado_por_user_id: string | null
          created_at: string
          cuenta_comercial_id: string | null
          datos: Json
          eje_jtbd: string
          empleado_id: string | null
          evento_padre_id: string | null
          fecha_evento: string
          id: string
          mascota_id: string
          prestador_id: string | null
          soft_delete: boolean
          soft_delete_en: string | null
          soft_delete_motivo: string | null
          soft_delete_por: string | null
          tipo: string
          updated_at: string
          visibilidad: Json | null
        }
        Insert: {
          country_code: string
          creado_por_sistema?: string | null
          creado_por_user_id?: string | null
          created_at?: string
          cuenta_comercial_id?: string | null
          datos?: Json
          eje_jtbd: string
          empleado_id?: string | null
          evento_padre_id?: string | null
          fecha_evento: string
          id?: string
          mascota_id: string
          prestador_id?: string | null
          soft_delete?: boolean
          soft_delete_en?: string | null
          soft_delete_motivo?: string | null
          soft_delete_por?: string | null
          tipo: string
          updated_at?: string
          visibilidad?: Json | null
        }
        Update: {
          country_code?: string
          creado_por_sistema?: string | null
          creado_por_user_id?: string | null
          created_at?: string
          cuenta_comercial_id?: string | null
          datos?: Json
          eje_jtbd?: string
          empleado_id?: string | null
          evento_padre_id?: string | null
          fecha_evento?: string
          id?: string
          mascota_id?: string
          prestador_id?: string | null
          soft_delete?: boolean
          soft_delete_en?: string | null
          soft_delete_motivo?: string | null
          soft_delete_por?: string | null
          tipo?: string
          updated_at?: string
          visibilidad?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_mascota_creado_por_user_id_fkey"
            columns: ["creado_por_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_creado_por_user_id_fkey"
            columns: ["creado_por_user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "eventos_mascota_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
          {
            foreignKeyName: "eventos_mascota_eje_jtbd_fkey"
            columns: ["eje_jtbd"]
            isOneToOne: false
            referencedRelation: "cat_ejes_jtbd"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "eventos_mascota_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_evento_padre_id_fkey"
            columns: ["evento_padre_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_soft_delete_por_fkey"
            columns: ["soft_delete_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_soft_delete_por_fkey"
            columns: ["soft_delete_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "eventos_mascota_tipo_fkey"
            columns: ["tipo"]
            isOneToOne: false
            referencedRelation: "cat_tipos_evento"
            referencedColumns: ["codigo"]
          },
        ]
      }
      eventos_mascota_grooming: {
        Row: {
          country_code: string
          created_at: string
          empleado_id: string | null
          evento_atencion_id: string
          id: string
          mascota_id: string
          prestador_id: string
          tipo_pelaje_observado: string | null
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          empleado_id?: string | null
          evento_atencion_id: string
          id?: string
          mascota_id: string
          prestador_id: string
          tipo_pelaje_observado?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          empleado_id?: string | null
          evento_atencion_id?: string
          id?: string
          mascota_id?: string
          prestador_id?: string
          tipo_pelaje_observado?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_mascota_grooming_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_grooming_evento_atencion_id_fkey"
            columns: ["evento_atencion_id"]
            isOneToOne: false
            referencedRelation: "evento_atencion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_grooming_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_grooming_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_grooming_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_grooming_tipo_pelaje_observado_fkey"
            columns: ["tipo_pelaje_observado"]
            isOneToOne: false
            referencedRelation: "cat_tipos_pelaje"
            referencedColumns: ["codigo"]
          },
        ]
      }
      eventos_mascota_paseo: {
        Row: {
          country_code: string
          created_at: string
          empleado_id: string | null
          evento_atencion_id: string
          gps_estado: string | null
          gps_motivo_fallo: string | null
          id: string
          mascota_id: string
          prestador_id: string
          track_gps: Json | null
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          empleado_id?: string | null
          evento_atencion_id: string
          gps_estado?: string | null
          gps_motivo_fallo?: string | null
          id?: string
          mascota_id: string
          prestador_id: string
          track_gps?: Json | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          empleado_id?: string | null
          evento_atencion_id?: string
          gps_estado?: string | null
          gps_motivo_fallo?: string | null
          id?: string
          mascota_id?: string
          prestador_id?: string
          track_gps?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_mascota_paseo_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_paseo_evento_atencion_id_fkey"
            columns: ["evento_atencion_id"]
            isOneToOne: true
            referencedRelation: "evento_atencion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_paseo_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_paseo_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_mascota_paseo_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas: {
        Row: {
          clave_acceso: string | null
          country_code: string
          created_at: string
          descuento_total: number | null
          direccion: string | null
          direccion_emisor: string | null
          email: string | null
          estado: string
          fecha_emision: string
          id: string
          identificacion: string | null
          items: Json
          iva_valor: number | null
          numero_factura: string
          pdf_url: string | null
          pedido_id: string | null
          razon_social: string | null
          razon_social_emisor: string | null
          ruc_emisor: string | null
          sri_ambiente: string | null
          sri_error: string | null
          sri_fecha_autorizacion: string | null
          sri_numero_autorizacion: string | null
          subtotal_0: number | null
          subtotal_12: number | null
          subtotal_15: number | null
          suscripcion_id: string | null
          tipo: string
          tipo_identificacion: string | null
          total: number
          updated_at: string
          user_id: string
          xml_url: string | null
        }
        Insert: {
          clave_acceso?: string | null
          country_code?: string
          created_at?: string
          descuento_total?: number | null
          direccion?: string | null
          direccion_emisor?: string | null
          email?: string | null
          estado?: string
          fecha_emision?: string
          id?: string
          identificacion?: string | null
          items?: Json
          iva_valor?: number | null
          numero_factura: string
          pdf_url?: string | null
          pedido_id?: string | null
          razon_social?: string | null
          razon_social_emisor?: string | null
          ruc_emisor?: string | null
          sri_ambiente?: string | null
          sri_error?: string | null
          sri_fecha_autorizacion?: string | null
          sri_numero_autorizacion?: string | null
          subtotal_0?: number | null
          subtotal_12?: number | null
          subtotal_15?: number | null
          suscripcion_id?: string | null
          tipo?: string
          tipo_identificacion?: string | null
          total: number
          updated_at?: string
          user_id: string
          xml_url?: string | null
        }
        Update: {
          clave_acceso?: string | null
          country_code?: string
          created_at?: string
          descuento_total?: number | null
          direccion?: string | null
          direccion_emisor?: string | null
          email?: string | null
          estado?: string
          fecha_emision?: string
          id?: string
          identificacion?: string | null
          items?: Json
          iva_valor?: number | null
          numero_factura?: string
          pdf_url?: string | null
          pedido_id?: string | null
          razon_social?: string | null
          razon_social_emisor?: string | null
          ruc_emisor?: string | null
          sri_ambiente?: string | null
          sri_error?: string | null
          sri_fecha_autorizacion?: string | null
          sri_numero_autorizacion?: string | null
          subtotal_0?: number | null
          subtotal_12?: number | null
          subtotal_15?: number | null
          suscripcion_id?: string | null
          tipo?: string
          tipo_identificacion?: string | null
          total?: number
          updated_at?: string
          user_id?: string
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_logistico"
            referencedColumns: ["pedido_id"]
          },
          {
            foreignKeyName: "facturas_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      familia: {
        Row: {
          country_code: string
          created_at: string
          created_by_sistema: string | null
          created_by_user_id: string | null
          cuenta_comercial_id: string | null
          id: string
          nombre: string | null
          notas_internas: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          created_by_sistema?: string | null
          created_by_user_id?: string | null
          cuenta_comercial_id?: string | null
          id?: string
          nombre?: string | null
          notas_internas?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          created_by_sistema?: string | null
          created_by_user_id?: string | null
          cuenta_comercial_id?: string | null
          id?: string
          nombre?: string | null
          notas_internas?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "familia_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "familia_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
        ]
      }
      familia_miembro: {
        Row: {
          created_at: string
          desde: string
          familia_id: string
          hasta: string | null
          id: string
          invitado_por_user_id: string | null
          motivo_alta: string | null
          motivo_baja: string | null
          rol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          desde?: string
          familia_id: string
          hasta?: string | null
          id?: string
          invitado_por_user_id?: string | null
          motivo_alta?: string | null
          motivo_baja?: string | null
          rol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          desde?: string
          familia_id?: string
          hasta?: string | null
          id?: string
          invitado_por_user_id?: string | null
          motivo_alta?: string | null
          motivo_baja?: string | null
          rol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "familia_miembro_familia_id_fkey"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familia"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_configs: {
        Row: {
          absorbe_descuento_default: Database["public"]["Enums"]["quien_absorbe_descuento_enum"]
          activo: boolean
          categoria_origen: string | null
          country_code: string
          created_at: string
          created_by: string | null
          cuenta_comercial_id: string | null
          id: string
          notas: string | null
          parametros: Json
          prioridad: number
          revenue_stream: Database["public"]["Enums"]["revenue_stream_enum"]
          tipo_actor: Database["public"]["Enums"]["tipo_actor_enum"] | null
          tipo_calculo: Database["public"]["Enums"]["tipo_calculo_fee_enum"]
          tipo_origen: string | null
          updated_at: string
          vigencia_desde: string
          vigencia_hasta: string | null
        }
        Insert: {
          absorbe_descuento_default?: Database["public"]["Enums"]["quien_absorbe_descuento_enum"]
          activo?: boolean
          categoria_origen?: string | null
          country_code: string
          created_at?: string
          created_by?: string | null
          cuenta_comercial_id?: string | null
          id?: string
          notas?: string | null
          parametros: Json
          prioridad?: number
          revenue_stream: Database["public"]["Enums"]["revenue_stream_enum"]
          tipo_actor?: Database["public"]["Enums"]["tipo_actor_enum"] | null
          tipo_calculo: Database["public"]["Enums"]["tipo_calculo_fee_enum"]
          tipo_origen?: string | null
          updated_at?: string
          vigencia_desde?: string
          vigencia_hasta?: string | null
        }
        Update: {
          absorbe_descuento_default?: Database["public"]["Enums"]["quien_absorbe_descuento_enum"]
          activo?: boolean
          categoria_origen?: string | null
          country_code?: string
          created_at?: string
          created_by?: string | null
          cuenta_comercial_id?: string | null
          id?: string
          notas?: string | null
          parametros?: Json
          prioridad?: number
          revenue_stream?: Database["public"]["Enums"]["revenue_stream_enum"]
          tipo_actor?: Database["public"]["Enums"]["tipo_actor_enum"] | null
          tipo_calculo?: Database["public"]["Enums"]["tipo_calculo_fee_enum"]
          tipo_origen?: string | null
          updated_at?: string
          vigencia_desde?: string
          vigencia_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fee_configs_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_configs_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
        ]
      }
      fee_configs_historial: {
        Row: {
          cambiado_en: string
          cambiado_por: string | null
          fee_config_id: string
          id: string
          motivo: string | null
          operacion: string
          valor_anterior: Json | null
          valor_nuevo: Json | null
        }
        Insert: {
          cambiado_en?: string
          cambiado_por?: string | null
          fee_config_id: string
          id?: string
          motivo?: string | null
          operacion: string
          valor_anterior?: Json | null
          valor_nuevo?: Json | null
        }
        Update: {
          cambiado_en?: string
          cambiado_por?: string | null
          fee_config_id?: string
          id?: string
          motivo?: string | null
          operacion?: string
          valor_anterior?: Json | null
          valor_nuevo?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_configs_historial_cambiado_por_fkey"
            columns: ["cambiado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_configs_historial_cambiado_por_fkey"
            columns: ["cambiado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      historial_pagos_prime: {
        Row: {
          created_at: string
          id: string
          kushki_charge_id: string | null
          kushki_status: string | null
          monto: number
          periodo_fin: string
          periodo_inicio: string
          suscripcion_id: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kushki_charge_id?: string | null
          kushki_status?: string | null
          monto: number
          periodo_fin: string
          periodo_inicio: string
          suscripcion_id: string
          tipo?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kushki_charge_id?: string | null
          kushki_status?: string | null
          monto?: number
          periodo_fin?: string
          periodo_inicio?: string
          suscripcion_id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_pagos_prime_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_pagos_prime_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_pagos_prime_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      likes: {
        Row: {
          comentario_id: string | null
          created_at: string
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          comentario_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          comentario_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "post_comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      liquidacion_eventos: {
        Row: {
          created_at: string
          evento_economico_id: string
          id: string
          liquidacion_id: string
          monto_payout_incluido: number
        }
        Insert: {
          created_at?: string
          evento_economico_id: string
          id?: string
          liquidacion_id: string
          monto_payout_incluido: number
        }
        Update: {
          created_at?: string
          evento_economico_id?: string
          id?: string
          liquidacion_id?: string
          monto_payout_incluido?: number
        }
        Relationships: [
          {
            foreignKeyName: "liquidacion_eventos_evento_economico_id_fkey"
            columns: ["evento_economico_id"]
            isOneToOne: true
            referencedRelation: "eventos_economicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidacion_eventos_evento_economico_id_fkey"
            columns: ["evento_economico_id"]
            isOneToOne: true
            referencedRelation: "v_eventos_con_origen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidacion_eventos_liquidacion_id_fkey"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "liquidaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidacion_eventos_liquidacion_id_fkey"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "v_liquidaciones_pendientes_pago"
            referencedColumns: ["id"]
          },
        ]
      }
      liquidacion_pedidos: {
        Row: {
          created_at: string
          id: string
          liquidacion_id: string
          monto_incluido: number
          pedido_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liquidacion_id: string
          monto_incluido?: number
          pedido_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liquidacion_id?: string
          monto_incluido?: number
          pedido_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liquidacion_pedidos_liquidacion_id_fkey"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "seller_liquidaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidacion_pedidos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidacion_pedidos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_logistico"
            referencedColumns: ["pedido_id"]
          },
        ]
      }
      liquidaciones: {
        Row: {
          ajustes: number
          ajustes_detalle: Json
          aprobado_en: string | null
          aprobado_por: string | null
          archivo_url: string | null
          calculado_en: string | null
          country_code: string
          created_at: string
          cuenta_comercial_id: string
          disputa_motivo: string | null
          disputa_respuesta: string | null
          estado: Database["public"]["Enums"]["estado_liquidacion_enum"]
          eventos_count: number
          fecha_liberacion_holdback: string | null
          generado_en: string
          generado_por: string | null
          id: string
          metodo_pago: string | null
          moneda: string
          monto_bruto_total: number
          monto_kushki_total: number
          monto_neto_a_pagar: number
          monto_payout_total: number
          monto_plataforma_total: number
          monto_retenido_holdback: number
          notas_admin: string | null
          numero_liquidacion: string
          pagado_en: string | null
          periodo_fin: string
          periodo_inicio: string
          referencia_transferencia: string | null
          retenciones_fiscales: Json
          saldo_arrastre_aplicado: number
          updated_at: string
        }
        Insert: {
          ajustes?: number
          ajustes_detalle?: Json
          aprobado_en?: string | null
          aprobado_por?: string | null
          archivo_url?: string | null
          calculado_en?: string | null
          country_code: string
          created_at?: string
          cuenta_comercial_id: string
          disputa_motivo?: string | null
          disputa_respuesta?: string | null
          estado?: Database["public"]["Enums"]["estado_liquidacion_enum"]
          eventos_count?: number
          fecha_liberacion_holdback?: string | null
          generado_en?: string
          generado_por?: string | null
          id?: string
          metodo_pago?: string | null
          moneda: string
          monto_bruto_total?: number
          monto_kushki_total?: number
          monto_neto_a_pagar?: number
          monto_payout_total?: number
          monto_plataforma_total?: number
          monto_retenido_holdback?: number
          notas_admin?: string | null
          numero_liquidacion: string
          pagado_en?: string | null
          periodo_fin: string
          periodo_inicio: string
          referencia_transferencia?: string | null
          retenciones_fiscales?: Json
          saldo_arrastre_aplicado?: number
          updated_at?: string
        }
        Update: {
          ajustes?: number
          ajustes_detalle?: Json
          aprobado_en?: string | null
          aprobado_por?: string | null
          archivo_url?: string | null
          calculado_en?: string | null
          country_code?: string
          created_at?: string
          cuenta_comercial_id?: string
          disputa_motivo?: string | null
          disputa_respuesta?: string | null
          estado?: Database["public"]["Enums"]["estado_liquidacion_enum"]
          eventos_count?: number
          fecha_liberacion_holdback?: string | null
          generado_en?: string
          generado_por?: string | null
          id?: string
          metodo_pago?: string | null
          moneda?: string
          monto_bruto_total?: number
          monto_kushki_total?: number
          monto_neto_a_pagar?: number
          monto_payout_total?: number
          monto_plataforma_total?: number
          monto_retenido_holdback?: number
          notas_admin?: string | null
          numero_liquidacion?: string
          pagado_en?: string | null
          periodo_fin?: string
          periodo_inicio?: string
          referencia_transferencia?: string | null
          retenciones_fiscales?: Json
          saldo_arrastre_aplicado?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "liquidaciones_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidaciones_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "liquidaciones_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidaciones_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
          {
            foreignKeyName: "liquidaciones_generado_por_fkey"
            columns: ["generado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidaciones_generado_por_fkey"
            columns: ["generado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lista_espera: {
        Row: {
          camada_id: string | null
          convertido_en: string | null
          country_code: string
          created_at: string
          criadero_id: string | null
          estado: string
          id: string
          notas: string | null
          notificado_en: string | null
          posicion: number | null
          prestador_id: string | null
          producto_id: string | null
          raza_preferida: string | null
          sexo_preferido: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          camada_id?: string | null
          convertido_en?: string | null
          country_code?: string
          created_at?: string
          criadero_id?: string | null
          estado?: string
          id?: string
          notas?: string | null
          notificado_en?: string | null
          posicion?: number | null
          prestador_id?: string | null
          producto_id?: string | null
          raza_preferida?: string | null
          sexo_preferido?: string | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          camada_id?: string | null
          convertido_en?: string | null
          country_code?: string
          created_at?: string
          criadero_id?: string | null
          estado?: string
          id?: string
          notas?: string | null
          notificado_en?: string | null
          posicion?: number | null
          prestador_id?: string | null
          producto_id?: string | null
          raza_preferida?: string | null
          sexo_preferido?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lista_espera_camada_id_fkey"
            columns: ["camada_id"]
            isOneToOne: false
            referencedRelation: "criadero_camadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_criadero_id_fkey"
            columns: ["criadero_id"]
            isOneToOne: false
            referencedRelation: "criaderos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_criadero_id_fkey"
            columns: ["criadero_id"]
            isOneToOne: false
            referencedRelation: "v_criaderos_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      logros: {
        Row: {
          activo: boolean
          categoria: string
          codigo: string
          condicion: Json
          created_at: string
          descripcion: string
          es_repetible: boolean
          icono: string
          id: string
          nombre: string
          puntos: number
        }
        Insert: {
          activo?: boolean
          categoria: string
          codigo: string
          condicion?: Json
          created_at?: string
          descripcion: string
          es_repetible?: boolean
          icono: string
          id?: string
          nombre: string
          puntos?: number
        }
        Update: {
          activo?: boolean
          categoria?: string
          codigo?: string
          condicion?: Json
          created_at?: string
          descripcion?: string
          es_repetible?: boolean
          icono?: string
          id?: string
          nombre?: string
          puntos?: number
        }
        Relationships: []
      }
      logros_usuario: {
        Row: {
          id: string
          logro_id: string
          notificado: boolean
          obtenido_en: string
          user_id: string
          veces_obtenido: number
        }
        Insert: {
          id?: string
          logro_id: string
          notificado?: boolean
          obtenido_en?: string
          user_id: string
          veces_obtenido?: number
        }
        Update: {
          id?: string
          logro_id?: string
          notificado?: boolean
          obtenido_en?: string
          user_id?: string
          veces_obtenido?: number
        }
        Relationships: [
          {
            foreignKeyName: "logros_usuario_logro_id_fkey"
            columns: ["logro_id"]
            isOneToOne: false
            referencedRelation: "logros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logros_usuario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logros_usuario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      loyalty_b2b: {
        Row: {
          activo: boolean
          beneficios: Json | null
          codigo_socio: string | null
          comision_pct: number | null
          country_code: string
          created_at: string
          id: string
          nivel: string
          puntos_acumulados: number
          puntos_canjeados: number
          revenue_generado: number
          socio_id: string
          tipo_socio: string
          updated_at: string
          usuarios_activos: number
          usuarios_referidos: number
        }
        Insert: {
          activo?: boolean
          beneficios?: Json | null
          codigo_socio?: string | null
          comision_pct?: number | null
          country_code?: string
          created_at?: string
          id?: string
          nivel?: string
          puntos_acumulados?: number
          puntos_canjeados?: number
          revenue_generado?: number
          socio_id: string
          tipo_socio: string
          updated_at?: string
          usuarios_activos?: number
          usuarios_referidos?: number
        }
        Update: {
          activo?: boolean
          beneficios?: Json | null
          codigo_socio?: string | null
          comision_pct?: number | null
          country_code?: string
          created_at?: string
          id?: string
          nivel?: string
          puntos_acumulados?: number
          puntos_canjeados?: number
          revenue_generado?: number
          socio_id?: string
          tipo_socio?: string
          updated_at?: string
          usuarios_activos?: number
          usuarios_referidos?: number
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_b2b_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_b2b_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: true
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lugares_pet_friendly: {
        Row: {
          activo: boolean | null
          agregado_por: string | null
          calificacion_promedio: number | null
          ciudad: string
          country_code: string
          created_at: string
          descripcion: string | null
          direccion: string
          foto_url: string | null
          fotos: Json | null
          google_place_id: string | null
          id: string
          lat: number | null
          lon: number | null
          nombre: string
          permite_gatos: boolean | null
          permite_otros: boolean | null
          permite_perros: boolean | null
          requiere_correa: boolean | null
          tiene_agua: boolean | null
          tiene_area_pets: boolean | null
          tiene_snacks: boolean | null
          tipo: string
          total_resenas: number | null
          total_vistas: number | null
          updated_at: string
          verificado: boolean | null
        }
        Insert: {
          activo?: boolean | null
          agregado_por?: string | null
          calificacion_promedio?: number | null
          ciudad: string
          country_code?: string
          created_at?: string
          descripcion?: string | null
          direccion: string
          foto_url?: string | null
          fotos?: Json | null
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lon?: number | null
          nombre: string
          permite_gatos?: boolean | null
          permite_otros?: boolean | null
          permite_perros?: boolean | null
          requiere_correa?: boolean | null
          tiene_agua?: boolean | null
          tiene_area_pets?: boolean | null
          tiene_snacks?: boolean | null
          tipo: string
          total_resenas?: number | null
          total_vistas?: number | null
          updated_at?: string
          verificado?: boolean | null
        }
        Update: {
          activo?: boolean | null
          agregado_por?: string | null
          calificacion_promedio?: number | null
          ciudad?: string
          country_code?: string
          created_at?: string
          descripcion?: string | null
          direccion?: string
          foto_url?: string | null
          fotos?: Json | null
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lon?: number | null
          nombre?: string
          permite_gatos?: boolean | null
          permite_otros?: boolean | null
          permite_perros?: boolean | null
          requiere_correa?: boolean | null
          tiene_agua?: boolean | null
          tiene_area_pets?: boolean | null
          tiene_snacks?: boolean | null
          tipo?: string
          total_resenas?: number | null
          total_vistas?: number | null
          updated_at?: string
          verificado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "lugares_pet_friendly_agregado_por_fkey"
            columns: ["agregado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lugares_pet_friendly_agregado_por_fkey"
            columns: ["agregado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lugares_resenas: {
        Row: {
          calificacion: number
          comentario: string | null
          created_at: string
          es_visible: boolean
          fotos: Json | null
          id: string
          lugar_id: string
          mascota_id: string | null
          user_id: string
        }
        Insert: {
          calificacion: number
          comentario?: string | null
          created_at?: string
          es_visible?: boolean
          fotos?: Json | null
          id?: string
          lugar_id: string
          mascota_id?: string | null
          user_id: string
        }
        Update: {
          calificacion?: number
          comentario?: string | null
          created_at?: string
          es_visible?: boolean
          fotos?: Json | null
          id?: string
          lugar_id?: string
          mascota_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lugares_resenas_lugar_id_fkey"
            columns: ["lugar_id"]
            isOneToOne: false
            referencedRelation: "lugares_pet_friendly"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lugares_resenas_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lugares_resenas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lugares_resenas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mascota_acceso_prestador: {
        Row: {
          audit_log: Json
          created_at: string
          cuenta_comercial_id: string
          expira_en: string | null
          id: string
          mascota_id: string
          metodo_otorgamiento: string
          motivo_revocacion: string | null
          otorgado_en: string
          otorgado_por_user_id: string
          revocado_en: string | null
          revocado_por_user_id: string | null
          updated_at: string
        }
        Insert: {
          audit_log?: Json
          created_at?: string
          cuenta_comercial_id: string
          expira_en?: string | null
          id?: string
          mascota_id: string
          metodo_otorgamiento: string
          motivo_revocacion?: string | null
          otorgado_en?: string
          otorgado_por_user_id: string
          revocado_en?: string | null
          revocado_por_user_id?: string | null
          updated_at?: string
        }
        Update: {
          audit_log?: Json
          created_at?: string
          cuenta_comercial_id?: string
          expira_en?: string | null
          id?: string
          mascota_id?: string
          metodo_otorgamiento?: string
          motivo_revocacion?: string | null
          otorgado_en?: string
          otorgado_por_user_id?: string
          revocado_en?: string | null
          revocado_por_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mascota_acceso_prestador_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mascota_acceso_prestador_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
          {
            foreignKeyName: "mascota_acceso_prestador_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mascota_acceso_prestador_otorgado_por_user_id_fkey"
            columns: ["otorgado_por_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mascota_acceso_prestador_otorgado_por_user_id_fkey"
            columns: ["otorgado_por_user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mascota_acceso_prestador_revocado_por_user_id_fkey"
            columns: ["revocado_por_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mascota_acceso_prestador_revocado_por_user_id_fkey"
            columns: ["revocado_por_user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mascota_codueño: {
        Row: {
          agregado_por_user_id: string | null
          created_at: string
          desde: string
          familia_id: string
          hasta: string | null
          id: string
          mascota_id: string
          motivo_alta: string | null
          motivo_cierre: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agregado_por_user_id?: string | null
          created_at?: string
          desde?: string
          familia_id: string
          hasta?: string | null
          id?: string
          mascota_id: string
          motivo_alta?: string | null
          motivo_cierre?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agregado_por_user_id?: string | null
          created_at?: string
          desde?: string
          familia_id?: string
          hasta?: string | null
          id?: string
          mascota_id?: string
          motivo_alta?: string | null
          motivo_cierre?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mascota_codueño_familia_id_fkey"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mascota_codueño_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      mascota_familiar_autorizado: {
        Row: {
          agregado_por_user_id: string | null
          created_at: string
          desde: string
          familia_id: string
          hasta: string | null
          id: string
          mascota_id: string
          motivo_alta: string | null
          motivo_cierre: string | null
          permisos: Json
          tipo_autorizado: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agregado_por_user_id?: string | null
          created_at?: string
          desde?: string
          familia_id: string
          hasta?: string | null
          id?: string
          mascota_id: string
          motivo_alta?: string | null
          motivo_cierre?: string | null
          permisos?: Json
          tipo_autorizado: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agregado_por_user_id?: string | null
          created_at?: string
          desde?: string
          familia_id?: string
          hasta?: string | null
          id?: string
          mascota_id?: string
          motivo_alta?: string | null
          motivo_cierre?: string | null
          permisos?: Json
          tipo_autorizado?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mascota_familiar_autorizado_familia_id_fkey"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mascota_familiar_autorizado_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      mascota_perfil_vigente: {
        Row: {
          alergias: Json
          condiciones_cronicas: Json
          created_at: string
          identidad_personal: Json
          intervenciones_permanentes: Json
          mascota_id: string
          medicacion_actual: Json
          microchip_activo: string | null
          peso_clinico_kg: number | null
          peso_clinico_medido_en: string | null
          peso_reportado_kg: number | null
          peso_reportado_medido_en: string | null
          peso_reportado_metodo: string | null
          plan_nutricional_actual: Json | null
          prestadores_habituales: Json
          seguro_activo_id: string | null
          temperamento: Json
          tiene_emergencia_activa: boolean
          ultimo_evento_fecha: string | null
          ultimo_evento_id: string | null
          updated_at: string
        }
        Insert: {
          alergias?: Json
          condiciones_cronicas?: Json
          created_at?: string
          identidad_personal?: Json
          intervenciones_permanentes?: Json
          mascota_id: string
          medicacion_actual?: Json
          microchip_activo?: string | null
          peso_clinico_kg?: number | null
          peso_clinico_medido_en?: string | null
          peso_reportado_kg?: number | null
          peso_reportado_medido_en?: string | null
          peso_reportado_metodo?: string | null
          plan_nutricional_actual?: Json | null
          prestadores_habituales?: Json
          seguro_activo_id?: string | null
          temperamento?: Json
          tiene_emergencia_activa?: boolean
          ultimo_evento_fecha?: string | null
          ultimo_evento_id?: string | null
          updated_at?: string
        }
        Update: {
          alergias?: Json
          condiciones_cronicas?: Json
          created_at?: string
          identidad_personal?: Json
          intervenciones_permanentes?: Json
          mascota_id?: string
          medicacion_actual?: Json
          microchip_activo?: string | null
          peso_clinico_kg?: number | null
          peso_clinico_medido_en?: string | null
          peso_reportado_kg?: number | null
          peso_reportado_medido_en?: string | null
          peso_reportado_metodo?: string | null
          plan_nutricional_actual?: Json | null
          prestadores_habituales?: Json
          seguro_activo_id?: string | null
          temperamento?: Json
          tiene_emergencia_activa?: boolean
          ultimo_evento_fecha?: string | null
          ultimo_evento_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mascota_perfil_vigente_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: true
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mascota_perfil_vigente_seguro_activo_id_fkey"
            columns: ["seguro_activo_id"]
            isOneToOne: false
            referencedRelation: "seguro_polizas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mascota_perfil_vigente_ultimo_evento_id_fkey"
            columns: ["ultimo_evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
        ]
      }
      mascota_visibilidad_config: {
        Row: {
          created_at: string
          id: string
          mascota_id: string
          modo_publico_global: string
          updated_at: string
          updated_by_user_id: string | null
          visibilidad_por_dimension: Json
        }
        Insert: {
          created_at?: string
          id?: string
          mascota_id: string
          modo_publico_global?: string
          updated_at?: string
          updated_by_user_id?: string | null
          visibilidad_por_dimension?: Json
        }
        Update: {
          created_at?: string
          id?: string
          mascota_id?: string
          modo_publico_global?: string
          updated_at?: string
          updated_by_user_id?: string | null
          visibilidad_por_dimension?: Json
        }
        Relationships: [
          {
            foreignKeyName: "mascota_visibilidad_config_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: true
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      mascotas: {
        Row: {
          country_code: string
          created_at: string
          criadero_id: string | null
          especie: string
          estado_vida: string
          estado_vida_desde: string
          familia_id: string
          fecha_alta: string
          fecha_nacimiento: string | null
          fecha_nacimiento_precision: string | null
          foto_url: string | null
          id: string
          microchip: string | null
          nombre: string
          origen: string
          pet_hash: string
          raza: string | null
          refugio_id: string | null
          sexo: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          country_code?: string
          created_at?: string
          criadero_id?: string | null
          especie?: string
          estado_vida?: string
          estado_vida_desde?: string
          familia_id: string
          fecha_alta?: string
          fecha_nacimiento?: string | null
          fecha_nacimiento_precision?: string | null
          foto_url?: string | null
          id?: string
          microchip?: string | null
          nombre: string
          origen: string
          pet_hash?: string
          raza?: string | null
          refugio_id?: string | null
          sexo?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string
          criadero_id?: string | null
          especie?: string
          estado_vida?: string
          estado_vida_desde?: string
          familia_id?: string
          fecha_alta?: string
          fecha_nacimiento?: string | null
          fecha_nacimiento_precision?: string | null
          foto_url?: string | null
          id?: string
          microchip?: string | null
          nombre?: string
          origen?: string
          pet_hash?: string
          raza?: string | null
          refugio_id?: string | null
          sexo?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mascotas_criadero_id_fkey"
            columns: ["criadero_id"]
            isOneToOne: false
            referencedRelation: "criaderos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mascotas_criadero_id_fkey"
            columns: ["criadero_id"]
            isOneToOne: false
            referencedRelation: "v_criaderos_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mascotas_especie_fk"
            columns: ["especie"]
            isOneToOne: false
            referencedRelation: "cat_especies"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "mascotas_familia_id_fkey"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mascotas_refugio_id_fkey"
            columns: ["refugio_id"]
            isOneToOne: false
            referencedRelation: "refugios"
            referencedColumns: ["id"]
          },
        ]
      }
      mascotas_adopcion: {
        Row: {
          activa: boolean | null
          color: string | null
          compatible_mascotas: boolean | null
          compatible_ninos: boolean | null
          costo_esteril: number | null
          costo_vacunas: number | null
          created_at: string | null
          descripcion: string | null
          edad: string | null
          especie: string
          estado: string
          esterilizada: boolean | null
          favoritos: number | null
          foto: string | null
          historia: string | null
          id: string
          necesidades_especiales: string | null
          nivel_adiestramiento: string | null
          nivel_energia: string | null
          nombre: string
          raza: string | null
          refugio_id: string | null
          requiere_espacio: boolean | null
          requiere_jardin: boolean | null
          sexo: string | null
          tamanio: string | null
          urgente: boolean | null
          vacunada: boolean | null
          vistas: number | null
        }
        Insert: {
          activa?: boolean | null
          color?: string | null
          compatible_mascotas?: boolean | null
          compatible_ninos?: boolean | null
          costo_esteril?: number | null
          costo_vacunas?: number | null
          created_at?: string | null
          descripcion?: string | null
          edad?: string | null
          especie: string
          estado?: string
          esterilizada?: boolean | null
          favoritos?: number | null
          foto?: string | null
          historia?: string | null
          id?: string
          necesidades_especiales?: string | null
          nivel_adiestramiento?: string | null
          nivel_energia?: string | null
          nombre: string
          raza?: string | null
          refugio_id?: string | null
          requiere_espacio?: boolean | null
          requiere_jardin?: boolean | null
          sexo?: string | null
          tamanio?: string | null
          urgente?: boolean | null
          vacunada?: boolean | null
          vistas?: number | null
        }
        Update: {
          activa?: boolean | null
          color?: string | null
          compatible_mascotas?: boolean | null
          compatible_ninos?: boolean | null
          costo_esteril?: number | null
          costo_vacunas?: number | null
          created_at?: string | null
          descripcion?: string | null
          edad?: string | null
          especie?: string
          estado?: string
          esterilizada?: boolean | null
          favoritos?: number | null
          foto?: string | null
          historia?: string | null
          id?: string
          necesidades_especiales?: string | null
          nivel_adiestramiento?: string | null
          nivel_energia?: string | null
          nombre?: string
          raza?: string | null
          refugio_id?: string | null
          requiere_espacio?: boolean | null
          requiere_jardin?: boolean | null
          sexo?: string | null
          tamanio?: string | null
          urgente?: boolean | null
          vacunada?: boolean | null
          vistas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mascotas_adopcion_refugio_id_fkey"
            columns: ["refugio_id"]
            isOneToOne: false
            referencedRelation: "refugios"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes_admin_seller: {
        Row: {
          contenido: string
          created_at: string
          id: string
          leido: boolean
          leido_en: string | null
          remitente: string
          remitente_id: string
          seller_id: string
        }
        Insert: {
          contenido: string
          created_at?: string
          id?: string
          leido?: boolean
          leido_en?: string | null
          remitente: string
          remitente_id: string
          seller_id: string
        }
        Update: {
          contenido?: string
          created_at?: string
          id?: string
          leido?: boolean
          leido_en?: string | null
          remitente?: string
          remitente_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_admin_seller_remitente_id_fkey"
            columns: ["remitente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_admin_seller_remitente_id_fkey"
            columns: ["remitente_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mensajes_admin_seller_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_admin_seller_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      metricas_negocio: {
        Row: {
          burn_rate: number | null
          cac_estimado: number | null
          caja_disponible: number | null
          calculated_at: string
          churn_usuarios: number | null
          citas_agendadas: number | null
          citas_completadas: number | null
          country_code: string
          fecha: string
          gasto_marketing: number | null
          gmv_acumulado: number | null
          gmv_dia: number | null
          id: string
          mascotas_nuevas: number | null
          mascotas_total: number | null
          mrr: number | null
          pedidos_cancelados: number | null
          pedidos_completados: number | null
          pedidos_nuevos: number | null
          revenue_dia: number | null
          take_rate_pct: number | null
          ticket_promedio: number | null
          usuarios_activos_dia: number | null
          usuarios_activos_mes: number | null
          usuarios_nuevos: number | null
        }
        Insert: {
          burn_rate?: number | null
          cac_estimado?: number | null
          caja_disponible?: number | null
          calculated_at?: string
          churn_usuarios?: number | null
          citas_agendadas?: number | null
          citas_completadas?: number | null
          country_code?: string
          fecha: string
          gasto_marketing?: number | null
          gmv_acumulado?: number | null
          gmv_dia?: number | null
          id?: string
          mascotas_nuevas?: number | null
          mascotas_total?: number | null
          mrr?: number | null
          pedidos_cancelados?: number | null
          pedidos_completados?: number | null
          pedidos_nuevos?: number | null
          revenue_dia?: number | null
          take_rate_pct?: number | null
          ticket_promedio?: number | null
          usuarios_activos_dia?: number | null
          usuarios_activos_mes?: number | null
          usuarios_nuevos?: number | null
        }
        Update: {
          burn_rate?: number | null
          cac_estimado?: number | null
          caja_disponible?: number | null
          calculated_at?: string
          churn_usuarios?: number | null
          citas_agendadas?: number | null
          citas_completadas?: number | null
          country_code?: string
          fecha?: string
          gasto_marketing?: number | null
          gmv_acumulado?: number | null
          gmv_dia?: number | null
          id?: string
          mascotas_nuevas?: number | null
          mascotas_total?: number | null
          mrr?: number | null
          pedidos_cancelados?: number | null
          pedidos_completados?: number | null
          pedidos_nuevos?: number | null
          revenue_dia?: number | null
          take_rate_pct?: number | null
          ticket_promedio?: number | null
          usuarios_activos_dia?: number | null
          usuarios_activos_mes?: number | null
          usuarios_nuevos?: number | null
        }
        Relationships: []
      }
      niveles: {
        Row: {
          beneficio_extra: string | null
          color: string
          created_at: string
          descripcion: string | null
          icono: string
          id: string
          nombre: string
          nombre_display: string
          orden: number
          puntos_maximos: number | null
          puntos_minimos: number
        }
        Insert: {
          beneficio_extra?: string | null
          color?: string
          created_at?: string
          descripcion?: string | null
          icono: string
          id?: string
          nombre: string
          nombre_display: string
          orden?: number
          puntos_maximos?: number | null
          puntos_minimos?: number
        }
        Update: {
          beneficio_extra?: string | null
          color?: string
          created_at?: string
          descripcion?: string | null
          icono?: string
          id?: string
          nombre?: string
          nombre_display?: string
          orden?: number
          puntos_maximos?: number | null
          puntos_minimos?: number
        }
        Relationships: []
      }
      notas_admin_usuario: {
        Row: {
          autor_id: string | null
          created_at: string
          id: string
          nota: string
          user_id: string
        }
        Insert: {
          autor_id?: string | null
          created_at?: string
          id?: string
          nota: string
          user_id: string
        }
        Update: {
          autor_id?: string | null
          created_at?: string
          id?: string
          nota?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_admin_usuario_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_admin_usuario_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notas_admin_usuario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_admin_usuario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          canal: string
          country_code: string
          created_at: string
          datos: Json | null
          enviada: boolean
          enviada_en: string | null
          error_envio: string | null
          id: string
          leida: boolean
          leida_en: string | null
          mensaje: string
          rol_destino: string
          tipo: string
          titulo: string
          url_accion: string | null
          user_id: string
        }
        Insert: {
          canal?: string
          country_code?: string
          created_at?: string
          datos?: Json | null
          enviada?: boolean
          enviada_en?: string | null
          error_envio?: string | null
          id?: string
          leida?: boolean
          leida_en?: string | null
          mensaje: string
          rol_destino: string
          tipo: string
          titulo: string
          url_accion?: string | null
          user_id: string
        }
        Update: {
          canal?: string
          country_code?: string
          created_at?: string
          datos?: Json | null
          enviada?: boolean
          enviada_en?: string | null
          error_envio?: string | null
          id?: string
          leida?: boolean
          leida_en?: string | null
          mensaje?: string
          rol_destino?: string
          tipo?: string
          titulo?: string
          url_accion?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pedido_items: {
        Row: {
          cantidad: number
          created_at: string
          despachado_en: string | null
          entregado_en: string | null
          estado_item: string
          id: string
          liquidacion_id: string | null
          nombre_producto: string
          pedido_id: string
          precio_unitario: number
          producto_id: string
          seller_id: string | null
          subtotal: number
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          despachado_en?: string | null
          entregado_en?: string | null
          estado_item?: string
          id?: string
          liquidacion_id?: string | null
          nombre_producto: string
          pedido_id: string
          precio_unitario: number
          producto_id: string
          seller_id?: string | null
          subtotal: number
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          despachado_en?: string | null
          entregado_en?: string | null
          estado_item?: string
          id?: string
          liquidacion_id?: string | null
          nombre_producto?: string
          pedido_id?: string
          precio_unitario?: number
          producto_id?: string
          seller_id?: string | null
          subtotal?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_items_liquidacion_id_fkey"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "seller_liquidaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_logistico"
            referencedColumns: ["pedido_id"]
          },
          {
            foreignKeyName: "pedido_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pedidos: {
        Row: {
          ciudad: string | null
          country_code: string
          courier: string | null
          created_at: string | null
          cupon_codigo: string | null
          descuento_monto: number | null
          direccion: string | null
          entrega_hora_fin: string | null
          entrega_hora_inicio: string | null
          entrega_programada: string | null
          es_programado: boolean
          estado: string | null
          guest_email: string | null
          id: string
          items: Json | null
          kushki_charge_id: string | null
          kushki_response: Json | null
          kushki_status: string | null
          kushki_token: string | null
          metodo_pago: string | null
          notas_admin: string | null
          numero_orden: string | null
          pagado_en: string | null
          recurrente_id: string | null
          subtotal: number | null
          total: number | null
          tracking_code: string | null
          updated_at: string
          user_id: string | null
          vtex_order_id: string | null
        }
        Insert: {
          ciudad?: string | null
          country_code?: string
          courier?: string | null
          created_at?: string | null
          cupon_codigo?: string | null
          descuento_monto?: number | null
          direccion?: string | null
          entrega_hora_fin?: string | null
          entrega_hora_inicio?: string | null
          entrega_programada?: string | null
          es_programado?: boolean
          estado?: string | null
          guest_email?: string | null
          id?: string
          items?: Json | null
          kushki_charge_id?: string | null
          kushki_response?: Json | null
          kushki_status?: string | null
          kushki_token?: string | null
          metodo_pago?: string | null
          notas_admin?: string | null
          numero_orden?: string | null
          pagado_en?: string | null
          recurrente_id?: string | null
          subtotal?: number | null
          total?: number | null
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
          vtex_order_id?: string | null
        }
        Update: {
          ciudad?: string | null
          country_code?: string
          courier?: string | null
          created_at?: string | null
          cupon_codigo?: string | null
          descuento_monto?: number | null
          direccion?: string | null
          entrega_hora_fin?: string | null
          entrega_hora_inicio?: string | null
          entrega_programada?: string | null
          es_programado?: boolean
          estado?: string | null
          guest_email?: string | null
          id?: string
          items?: Json | null
          kushki_charge_id?: string | null
          kushki_response?: Json | null
          kushki_status?: string | null
          kushki_token?: string | null
          metodo_pago?: string | null
          notas_admin?: string | null
          numero_orden?: string | null
          pagado_en?: string | null
          recurrente_id?: string | null
          subtotal?: number | null
          total?: number | null
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
          vtex_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pedido_recurrente"
            columns: ["recurrente_id"]
            isOneToOne: false
            referencedRelation: "pedidos_recurrentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pedido_recurrente"
            columns: ["recurrente_id"]
            isOneToOne: false
            referencedRelation: "v_recurrentes_pendientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_recurrentes: {
        Row: {
          activo: boolean
          ciudad: string | null
          country_code: string
          created_at: string
          direccion: string | null
          entrega_hora_fin: string | null
          entrega_hora_inicio: string | null
          frecuencia_dias: number
          frecuencia_tipo: string
          id: string
          items: Json
          kushki_token: string | null
          max_pedidos: number | null
          motivo_pausa: string | null
          pausado_hasta: string | null
          pedidos_generados: number
          proximo_pedido: string
          ultimo_pedido_en: string | null
          ultimo_pedido_id: string | null
          ultimo_total: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          ciudad?: string | null
          country_code?: string
          created_at?: string
          direccion?: string | null
          entrega_hora_fin?: string | null
          entrega_hora_inicio?: string | null
          frecuencia_dias?: number
          frecuencia_tipo: string
          id?: string
          items?: Json
          kushki_token?: string | null
          max_pedidos?: number | null
          motivo_pausa?: string | null
          pausado_hasta?: string | null
          pedidos_generados?: number
          proximo_pedido: string
          ultimo_pedido_en?: string | null
          ultimo_pedido_id?: string | null
          ultimo_total?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          ciudad?: string | null
          country_code?: string
          created_at?: string
          direccion?: string | null
          entrega_hora_fin?: string | null
          entrega_hora_inicio?: string | null
          frecuencia_dias?: number
          frecuencia_tipo?: string
          id?: string
          items?: Json
          kushki_token?: string | null
          max_pedidos?: number | null
          motivo_pausa?: string | null
          pausado_hasta?: string | null
          pedidos_generados?: number
          proximo_pedido?: string
          ultimo_pedido_en?: string | null
          ultimo_pedido_id?: string | null
          ultimo_total?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_recurrentes_ultimo_pedido_id_fkey"
            columns: ["ultimo_pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_recurrentes_ultimo_pedido_id_fkey"
            columns: ["ultimo_pedido_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_logistico"
            referencedColumns: ["pedido_id"]
          },
          {
            foreignKeyName: "pedidos_recurrentes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_recurrentes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      planes_nutricion: {
        Row: {
          activo: boolean
          alimento_recomendado: string | null
          calorias_diarias: number | null
          cantidad_diaria_gr: number | null
          carbohidrato_pct: number | null
          condicion_corporal: number | null
          country_code: string
          created_at: string
          duracion_semanas: number | null
          generado_por: string | null
          gramos_por_racion: number | null
          grasa_pct: number | null
          id: string
          marca_recomendada: string | null
          mascota_id: string
          nivel_actividad: string | null
          notas_ia: string | null
          peso_actual_kg: number | null
          peso_objetivo_kg: number | null
          producto_id: string | null
          proteina_pct: number | null
          proxima_revision: string | null
          raciones_por_dia: number | null
          recurrente_id: string | null
          suplementos: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          alimento_recomendado?: string | null
          calorias_diarias?: number | null
          cantidad_diaria_gr?: number | null
          carbohidrato_pct?: number | null
          condicion_corporal?: number | null
          country_code?: string
          created_at?: string
          duracion_semanas?: number | null
          generado_por?: string | null
          gramos_por_racion?: number | null
          grasa_pct?: number | null
          id?: string
          marca_recomendada?: string | null
          mascota_id: string
          nivel_actividad?: string | null
          notas_ia?: string | null
          peso_actual_kg?: number | null
          peso_objetivo_kg?: number | null
          producto_id?: string | null
          proteina_pct?: number | null
          proxima_revision?: string | null
          raciones_por_dia?: number | null
          recurrente_id?: string | null
          suplementos?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          alimento_recomendado?: string | null
          calorias_diarias?: number | null
          cantidad_diaria_gr?: number | null
          carbohidrato_pct?: number | null
          condicion_corporal?: number | null
          country_code?: string
          created_at?: string
          duracion_semanas?: number | null
          generado_por?: string | null
          gramos_por_racion?: number | null
          grasa_pct?: number | null
          id?: string
          marca_recomendada?: string | null
          mascota_id?: string
          nivel_actividad?: string | null
          notas_ia?: string | null
          peso_actual_kg?: number | null
          peso_objetivo_kg?: number | null
          producto_id?: string | null
          proteina_pct?: number | null
          proxima_revision?: string | null
          raciones_por_dia?: number | null
          recurrente_id?: string | null
          suplementos?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planes_nutricion_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_nutricion_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_nutricion_recurrente_id_fkey"
            columns: ["recurrente_id"]
            isOneToOne: false
            referencedRelation: "pedidos_recurrentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_nutricion_recurrente_id_fkey"
            columns: ["recurrente_id"]
            isOneToOne: false
            referencedRelation: "v_recurrentes_pendientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_nutricion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_nutricion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      planes_prime: {
        Row: {
          activo: boolean
          beneficios: Json
          color_badge: string | null
          country_code: string
          created_at: string
          descripcion: string | null
          es_default: boolean
          es_trial_disponible: boolean | null
          features: Json
          icono: string | null
          id: string
          nombre: string
          orden_display: number | null
          precio_anual: number | null
          precio_mensual: number
          trial_dias: number | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          beneficios?: Json
          color_badge?: string | null
          country_code?: string
          created_at?: string
          descripcion?: string | null
          es_default?: boolean
          es_trial_disponible?: boolean | null
          features?: Json
          icono?: string | null
          id?: string
          nombre: string
          orden_display?: number | null
          precio_anual?: number | null
          precio_mensual: number
          trial_dias?: number | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          beneficios?: Json
          color_badge?: string | null
          country_code?: string
          created_at?: string
          descripcion?: string | null
          es_default?: boolean
          es_trial_disponible?: boolean | null
          features?: Json
          icono?: string | null
          id?: string
          nombre?: string
          orden_display?: number | null
          precio_anual?: number | null
          precio_mensual?: number
          trial_dias?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      post_comentarios: {
        Row: {
          contenido: string
          created_at: string
          es_visible: boolean
          id: string
          likes: number
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          contenido: string
          created_at?: string
          es_visible?: boolean
          id?: string
          likes?: number
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          contenido?: string
          created_at?: string
          es_visible?: boolean
          id?: string
          likes?: number
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comentarios_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comentarios_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comentarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comentarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      posts: {
        Row: {
          ciudad: string | null
          comentarios: number
          compartidos: number
          contenido: string | null
          country_code: string
          created_at: string
          es_visible: boolean
          expira_en: string | null
          id: string
          lat: number | null
          likes: number
          lon: number | null
          mascota_id: string | null
          media_urls: Json | null
          reportado: boolean
          tipo: string
          total_reportes: number
          updated_at: string
          user_id: string
          visibilidad: string
          vistas: number
        }
        Insert: {
          ciudad?: string | null
          comentarios?: number
          compartidos?: number
          contenido?: string | null
          country_code?: string
          created_at?: string
          es_visible?: boolean
          expira_en?: string | null
          id?: string
          lat?: number | null
          likes?: number
          lon?: number | null
          mascota_id?: string | null
          media_urls?: Json | null
          reportado?: boolean
          tipo?: string
          total_reportes?: number
          updated_at?: string
          user_id: string
          visibilidad?: string
          vistas?: number
        }
        Update: {
          ciudad?: string | null
          comentarios?: number
          compartidos?: number
          contenido?: string | null
          country_code?: string
          created_at?: string
          es_visible?: boolean
          expira_en?: string | null
          id?: string
          lat?: number | null
          likes?: number
          lon?: number | null
          mascota_id?: string | null
          media_urls?: Json | null
          reportado?: boolean
          tipo?: string
          total_reportes?: number
          updated_at?: string
          user_id?: string
          visibilidad?: string
          vistas?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      prestador_atencion_log: {
        Row: {
          codigos_legales: Json
          created_at: string
          cuenta_comercial_id: string
          empleado_id: string | null
          evento_origen_id: string | null
          fecha_atencion: string
          id: string
          pet_country_code: string
          pet_especie: string
          pet_hash: string
          pet_raza: string | null
          prestador_id: string | null
          resumen_breve: string
          tipo_atencion: string
          tipo_evento_origen: string
        }
        Insert: {
          codigos_legales?: Json
          created_at?: string
          cuenta_comercial_id: string
          empleado_id?: string | null
          evento_origen_id?: string | null
          fecha_atencion: string
          id?: string
          pet_country_code: string
          pet_especie: string
          pet_hash: string
          pet_raza?: string | null
          prestador_id?: string | null
          resumen_breve: string
          tipo_atencion: string
          tipo_evento_origen: string
        }
        Update: {
          codigos_legales?: Json
          created_at?: string
          cuenta_comercial_id?: string
          empleado_id?: string | null
          evento_origen_id?: string | null
          fecha_atencion?: string
          id?: string
          pet_country_code?: string
          pet_especie?: string
          pet_hash?: string
          pet_raza?: string | null
          prestador_id?: string | null
          resumen_breve?: string
          tipo_atencion?: string
          tipo_evento_origen?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestador_atencion_log_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_atencion_log_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
          {
            foreignKeyName: "prestador_atencion_log_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_atencion_log_evento_origen_id_fkey"
            columns: ["evento_origen_id"]
            isOneToOne: false
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_atencion_log_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_atencion_log_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_atencion_log_tipo_evento_origen_fkey"
            columns: ["tipo_evento_origen"]
            isOneToOne: false
            referencedRelation: "cat_tipos_evento"
            referencedColumns: ["codigo"]
          },
        ]
      }
      prestador_bloqueos: {
        Row: {
          created_at: string
          fecha_fin: string
          fecha_inicio: string
          id: string
          motivo: string | null
          prestador_id: string
        }
        Insert: {
          created_at?: string
          fecha_fin: string
          fecha_inicio: string
          id?: string
          motivo?: string | null
          prestador_id: string
        }
        Update: {
          created_at?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          motivo?: string | null
          prestador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestador_bloqueos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_bloqueos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      prestador_documentos: {
        Row: {
          archivo_url: string
          created_at: string
          estado: string
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string
          nombre: string
          notas_revision: string | null
          prestador_id: string
          revisado_en: string | null
          revisado_por: string | null
          tipo: string
        }
        Insert: {
          archivo_url: string
          created_at?: string
          estado?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nombre: string
          notas_revision?: string | null
          prestador_id: string
          revisado_en?: string | null
          revisado_por?: string | null
          tipo: string
        }
        Update: {
          archivo_url?: string
          created_at?: string
          estado?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nombre?: string
          notas_revision?: string | null
          prestador_id?: string
          revisado_en?: string | null
          revisado_por?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestador_documentos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_documentos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_documentos_revisado_por_fkey"
            columns: ["revisado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_documentos_revisado_por_fkey"
            columns: ["revisado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      prestador_empleado_servicios: {
        Row: {
          created_at: string
          empleado_id: string
          servicio_id: string
        }
        Insert: {
          created_at?: string
          empleado_id: string
          servicio_id: string
        }
        Update: {
          created_at?: string
          empleado_id?: string
          servicio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestador_empleado_servicios_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_empleado_servicios_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "prestador_servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      prestador_empleados: {
        Row: {
          activado_en: string | null
          activo: boolean
          created_at: string
          created_by: string
          datos_bancarios: Json
          descripcion: string | null
          especialidades: Json | null
          foto_url: string | null
          id: string
          invitado_en: string | null
          modelo_pago: string
          nombre: string
          porcentaje_comision: number | null
          prestador_id: string
          rol: string
          user_id: string
        }
        Insert: {
          activado_en?: string | null
          activo?: boolean
          created_at?: string
          created_by: string
          datos_bancarios?: Json
          descripcion?: string | null
          especialidades?: Json | null
          foto_url?: string | null
          id?: string
          invitado_en?: string | null
          modelo_pago?: string
          nombre: string
          porcentaje_comision?: number | null
          prestador_id: string
          rol: string
          user_id: string
        }
        Update: {
          activado_en?: string | null
          activo?: boolean
          created_at?: string
          created_by?: string
          datos_bancarios?: Json
          descripcion?: string | null
          especialidades?: Json | null
          foto_url?: string | null
          id?: string
          invitado_en?: string | null
          modelo_pago?: string
          nombre?: string
          porcentaje_comision?: number | null
          prestador_id?: string
          rol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestador_empleados_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_empleados_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      prestador_horarios: {
        Row: {
          activo: boolean
          dia_semana: number
          duracion_slot_minutos: number
          empleado_id: string | null
          hora_fin: string
          hora_inicio: string
          id: string
          max_citas_por_slot: number | null
          prestador_id: string
          servicio_id: string | null
        }
        Insert: {
          activo?: boolean
          dia_semana: number
          duracion_slot_minutos?: number
          empleado_id?: string | null
          hora_fin: string
          hora_inicio: string
          id?: string
          max_citas_por_slot?: number | null
          prestador_id: string
          servicio_id?: string | null
        }
        Update: {
          activo?: boolean
          dia_semana?: number
          duracion_slot_minutos?: number
          empleado_id?: string | null
          hora_fin?: string
          hora_inicio?: string
          id?: string
          max_citas_por_slot?: number | null
          prestador_id?: string
          servicio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prestador_horarios_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_horarios_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_horarios_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_horarios_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "prestador_servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      prestador_recetas_frecuentes: {
        Row: {
          activa: boolean
          concentracion: string | null
          contador_uso: number
          country_code: string
          creada_manualmente: boolean
          creada_por_user_id: string | null
          created_at: string
          dosis: string
          duracion_dias: number | null
          forma_farmaceutica: string | null
          frecuencia: string
          id: string
          indicaciones_especiales: string | null
          nombre_medicamento: string
          prestador_id: string
          principio_activo: string | null
          ultima_vez_usada: string
          updated_at: string
          via_administracion: string | null
        }
        Insert: {
          activa?: boolean
          concentracion?: string | null
          contador_uso?: number
          country_code: string
          creada_manualmente?: boolean
          creada_por_user_id?: string | null
          created_at?: string
          dosis: string
          duracion_dias?: number | null
          forma_farmaceutica?: string | null
          frecuencia: string
          id?: string
          indicaciones_especiales?: string | null
          nombre_medicamento: string
          prestador_id: string
          principio_activo?: string | null
          ultima_vez_usada?: string
          updated_at?: string
          via_administracion?: string | null
        }
        Update: {
          activa?: boolean
          concentracion?: string | null
          contador_uso?: number
          country_code?: string
          creada_manualmente?: boolean
          creada_por_user_id?: string | null
          created_at?: string
          dosis?: string
          duracion_dias?: number | null
          forma_farmaceutica?: string | null
          frecuencia?: string
          id?: string
          indicaciones_especiales?: string | null
          nombre_medicamento?: string
          prestador_id?: string
          principio_activo?: string | null
          ultima_vez_usada?: string
          updated_at?: string
          via_administracion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prestador_recetas_frecuentes_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_recetas_frecuentes_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      prestador_resenas: {
        Row: {
          calificacion: number
          cita_id: string | null
          comentario: string | null
          created_at: string
          es_visible: boolean
          id: string
          prestador_id: string
          respuesta: string | null
          respuesta_en: string | null
          user_id: string
        }
        Insert: {
          calificacion: number
          cita_id?: string | null
          comentario?: string | null
          created_at?: string
          es_visible?: boolean
          id?: string
          prestador_id: string
          respuesta?: string | null
          respuesta_en?: string | null
          user_id: string
        }
        Update: {
          calificacion?: number
          cita_id?: string | null
          comentario?: string | null
          created_at?: string
          es_visible?: boolean
          id?: string
          prestador_id?: string
          respuesta?: string | null
          respuesta_en?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestador_resenas_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "evento_cita_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_resenas_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_resenas_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_resenas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_resenas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      prestador_servicios: {
        Row: {
          activo: boolean
          config: Json
          created_at: string
          descripcion: string | null
          duracion_minutos: number | null
          especies_compatibles: Json
          id: string
          nombre_custom: string | null
          precio: number
          precio_emergencia: number | null
          prestador_id: string
          tipo_servicio: string
        }
        Insert: {
          activo?: boolean
          config?: Json
          created_at?: string
          descripcion?: string | null
          duracion_minutos?: number | null
          especies_compatibles?: Json
          id?: string
          nombre_custom?: string | null
          precio?: number
          precio_emergencia?: number | null
          prestador_id: string
          tipo_servicio: string
        }
        Update: {
          activo?: boolean
          config?: Json
          created_at?: string
          descripcion?: string | null
          duracion_minutos?: number | null
          especies_compatibles?: Json
          id?: string
          nombre_custom?: string | null
          precio?: number
          precio_emergencia?: number | null
          prestador_id?: string
          tipo_servicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestador_servicios_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestador_servicios_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      prestadores: {
        Row: {
          acepta_emergencias: boolean | null
          acepta_telemedicina: boolean | null
          aprobado_en: string | null
          aprobado_por: string | null
          calificacion_promedio: number | null
          ciudad: string | null
          country_code: string
          created_at: string
          cuenta_comercial_id: string
          descripcion: string | null
          direccion: string | null
          email_contacto: string | null
          estado: string
          foto_url: string | null
          fotos_galeria: Json | null
          id: string
          lat: number | null
          lon: number | null
          matricula_profesional: string | null
          metadata: Json
          motivo_rechazo: string | null
          nombre_comercial: string
          radio_cobertura_km: number | null
          sector: string | null
          sitio_web: string | null
          telefono: string | null
          tipo: string
          total_citas: number | null
          total_resenas: number | null
          updated_at: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          acepta_emergencias?: boolean | null
          acepta_telemedicina?: boolean | null
          aprobado_en?: string | null
          aprobado_por?: string | null
          calificacion_promedio?: number | null
          ciudad?: string | null
          country_code?: string
          created_at?: string
          cuenta_comercial_id: string
          descripcion?: string | null
          direccion?: string | null
          email_contacto?: string | null
          estado?: string
          foto_url?: string | null
          fotos_galeria?: Json | null
          id?: string
          lat?: number | null
          lon?: number | null
          matricula_profesional?: string | null
          metadata?: Json
          motivo_rechazo?: string | null
          nombre_comercial: string
          radio_cobertura_km?: number | null
          sector?: string | null
          sitio_web?: string | null
          telefono?: string | null
          tipo: string
          total_citas?: number | null
          total_resenas?: number | null
          updated_at?: string
          user_id: string
          whatsapp: string
        }
        Update: {
          acepta_emergencias?: boolean | null
          acepta_telemedicina?: boolean | null
          aprobado_en?: string | null
          aprobado_por?: string | null
          calificacion_promedio?: number | null
          ciudad?: string | null
          country_code?: string
          created_at?: string
          cuenta_comercial_id?: string
          descripcion?: string | null
          direccion?: string | null
          email_contacto?: string | null
          estado?: string
          foto_url?: string | null
          fotos_galeria?: Json | null
          id?: string
          lat?: number | null
          lon?: number | null
          matricula_profesional?: string | null
          metadata?: Json
          motivo_rechazo?: string | null
          nombre_comercial?: string
          radio_cobertura_km?: number | null
          sector?: string | null
          sitio_web?: string | null
          telefono?: string | null
          tipo?: string
          total_citas?: number | null
          total_resenas?: number | null
          updated_at?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestadores_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestadores_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "prestadores_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestadores_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
          {
            foreignKeyName: "prestadores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestadores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      productos: {
        Row: {
          categoria: string
          created_at: string
          descripcion: string | null
          estado: string | null
          id: string
          imagen_url: string | null
          imagenes: Json | null
          nombre: string
          para_especie: string
          peso_kg: number | null
          precio: number
          seller_id: string | null
          seller_perfil_id: string | null
          sku: string | null
          stock: number | null
          stock_minimo: number | null
          updated_at: string | null
          variantes: Json | null
          vtex_product_id: string | null
          vtex_sincronizado_en: string | null
          vtex_sku_id: string | null
        }
        Insert: {
          categoria: string
          created_at?: string
          descripcion?: string | null
          estado?: string | null
          id?: string
          imagen_url?: string | null
          imagenes?: Json | null
          nombre: string
          para_especie?: string
          peso_kg?: number | null
          precio?: number
          seller_id?: string | null
          seller_perfil_id?: string | null
          sku?: string | null
          stock?: number | null
          stock_minimo?: number | null
          updated_at?: string | null
          variantes?: Json | null
          vtex_product_id?: string | null
          vtex_sincronizado_en?: string | null
          vtex_sku_id?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          descripcion?: string | null
          estado?: string | null
          id?: string
          imagen_url?: string | null
          imagenes?: Json | null
          nombre?: string
          para_especie?: string
          peso_kg?: number | null
          precio?: number
          seller_id?: string | null
          seller_perfil_id?: string | null
          sku?: string | null
          stock?: number | null
          stock_minimo?: number | null
          updated_at?: string | null
          variantes?: Json | null
          vtex_product_id?: string | null
          vtex_sincronizado_en?: string | null
          vtex_sku_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "productos_seller_perfil_id_fkey"
            columns: ["seller_perfil_id"]
            isOneToOne: false
            referencedRelation: "seller_perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      productos_comerciales: {
        Row: {
          activo: boolean
          codigo: string
          country_code: string
          created_at: string
          descripcion: string | null
          duracion_dias: number | null
          id: string
          moneda: string
          nombre: string
          parametros: Json
          periodicidad: string
          precio_lista: number
          revenue_stream: Database["public"]["Enums"]["revenue_stream_enum"]
          tipos_actor_destinatarios: Database["public"]["Enums"]["tipo_actor_enum"][]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          country_code: string
          created_at?: string
          descripcion?: string | null
          duracion_dias?: number | null
          id?: string
          moneda?: string
          nombre: string
          parametros?: Json
          periodicidad: string
          precio_lista: number
          revenue_stream: Database["public"]["Enums"]["revenue_stream_enum"]
          tipos_actor_destinatarios: Database["public"]["Enums"]["tipo_actor_enum"][]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          country_code?: string
          created_at?: string
          descripcion?: string | null
          duracion_dias?: number | null
          id?: string
          moneda?: string
          nombre?: string
          parametros?: Json
          periodicidad?: string
          precio_lista?: number
          revenue_stream?: Database["public"]["Enums"]["revenue_stream_enum"]
          tipos_actor_destinatarios?: Database["public"]["Enums"]["tipo_actor_enum"][]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ciudad: string | null
          codigo_referido: string | null
          country_code: string
          created_at: string
          direccion_apto: string | null
          direccion_ciudad: string | null
          direccion_completa: string | null
          direccion_fiscal: string | null
          direccion_guardada_como: string | null
          direccion_linea1: string | null
          direccion_pais: string | null
          direccion_principal: string | null
          direccion_referencias: string | null
          direccion_sector: string | null
          email: string
          foto_url: string | null
          id: string
          identificacion_fiscal: string | null
          is_prime: boolean
          nombre: string | null
          onboarding_completo: boolean | null
          pais: string | null
          pais_codigo: string | null
          prime_plan_id: string | null
          prime_vence_en: string | null
          razon_social_fiscal: string | null
          referido_por: string | null
          requiere_factura: boolean | null
          telefono: string | null
          telefono_codigo_pais: string | null
          telefono_tipo: string | null
          tipo_identificacion: string | null
          tipo_mascotas: string[] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          ciudad?: string | null
          codigo_referido?: string | null
          country_code?: string
          created_at?: string
          direccion_apto?: string | null
          direccion_ciudad?: string | null
          direccion_completa?: string | null
          direccion_fiscal?: string | null
          direccion_guardada_como?: string | null
          direccion_linea1?: string | null
          direccion_pais?: string | null
          direccion_principal?: string | null
          direccion_referencias?: string | null
          direccion_sector?: string | null
          email: string
          foto_url?: string | null
          id: string
          identificacion_fiscal?: string | null
          is_prime?: boolean
          nombre?: string | null
          onboarding_completo?: boolean | null
          pais?: string | null
          pais_codigo?: string | null
          prime_plan_id?: string | null
          prime_vence_en?: string | null
          razon_social_fiscal?: string | null
          referido_por?: string | null
          requiere_factura?: boolean | null
          telefono?: string | null
          telefono_codigo_pais?: string | null
          telefono_tipo?: string | null
          tipo_identificacion?: string | null
          tipo_mascotas?: string[] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          ciudad?: string | null
          codigo_referido?: string | null
          country_code?: string
          created_at?: string
          direccion_apto?: string | null
          direccion_ciudad?: string | null
          direccion_completa?: string | null
          direccion_fiscal?: string | null
          direccion_guardada_como?: string | null
          direccion_linea1?: string | null
          direccion_pais?: string | null
          direccion_principal?: string | null
          direccion_referencias?: string | null
          direccion_sector?: string | null
          email?: string
          foto_url?: string | null
          id?: string
          identificacion_fiscal?: string | null
          is_prime?: boolean
          nombre?: string | null
          onboarding_completo?: boolean | null
          pais?: string | null
          pais_codigo?: string | null
          prime_plan_id?: string | null
          prime_vence_en?: string | null
          razon_social_fiscal?: string | null
          referido_por?: string | null
          requiere_factura?: boolean | null
          telefono?: string | null
          telefono_codigo_pais?: string | null
          telefono_tipo?: string | null
          tipo_identificacion?: string | null
          tipo_mascotas?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_prime_plan_id_fkey"
            columns: ["prime_plan_id"]
            isOneToOne: false
            referencedRelation: "planes_prime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referido_por_fkey"
            columns: ["referido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referido_por_fkey"
            columns: ["referido_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      puntos_usuario: {
        Row: {
          created_at: string
          id: string
          nivel_id: string | null
          puntos_mes: number
          puntos_totales: number
          racha_dias: number
          ultima_actividad: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nivel_id?: string | null
          puntos_mes?: number
          puntos_totales?: number
          racha_dias?: number
          ultima_actividad?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nivel_id?: string | null
          puntos_mes?: number
          puntos_totales?: number
          racha_dias?: number
          ultima_actividad?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "puntos_usuario_nivel_id_fkey"
            columns: ["nivel_id"]
            isOneToOne: false
            referencedRelation: "niveles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puntos_usuario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puntos_usuario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          last_used_at: string | null
          plataforma: string
          token: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          last_used_at?: string | null
          plataforma: string
          token: string
          user_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          last_used_at?: string | null
          plataforma?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referidos: {
        Row: {
          canal: string | null
          codigo_referido: string
          created_at: string
          email_invitado: string | null
          estado: string
          id: string
          primer_pedido_en: string | null
          primera_cita_en: string | null
          puntos_otorgados: number | null
          puntos_otorgados_en: string | null
          referido_id: string | null
          referidor_id: string
          updated_at: string
        }
        Insert: {
          canal?: string | null
          codigo_referido: string
          created_at?: string
          email_invitado?: string | null
          estado?: string
          id?: string
          primer_pedido_en?: string | null
          primera_cita_en?: string | null
          puntos_otorgados?: number | null
          puntos_otorgados_en?: string | null
          referido_id?: string | null
          referidor_id: string
          updated_at?: string
        }
        Update: {
          canal?: string | null
          codigo_referido?: string
          created_at?: string
          email_invitado?: string | null
          estado?: string
          id?: string
          primer_pedido_en?: string | null
          primera_cita_en?: string | null
          puntos_otorgados?: number | null
          puntos_otorgados_en?: string | null
          referido_id?: string | null
          referidor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referidos_referido_id_fkey"
            columns: ["referido_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referidos_referido_id_fkey"
            columns: ["referido_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referidos_referidor_id_fkey"
            columns: ["referidor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referidos_referidor_id_fkey"
            columns: ["referidor_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      refugios: {
        Row: {
          acepta_donaciones: boolean
          calificacion_promedio: number
          capacidad_maxima: number | null
          certificaciones: Json
          ciudad: string
          country_code: string
          created_at: string
          cuenta_comercial_id: string
          descripcion: string | null
          direccion: string | null
          email: string | null
          especies_atendidas: Json
          estado: string
          facebook: string | null
          foto_url: string | null
          fotos_galeria: Json
          historia: string | null
          horario_visitas: Json
          id: string
          instagram: string | null
          lat: number | null
          lon: number | null
          metadata: Json
          moneda_donaciones: string | null
          monto_minimo_donacion: number | null
          motivo_rechazo: string | null
          nombre: string
          numero_registro: string | null
          permisos_legales: Json
          provincia: string | null
          sitio_web: string | null
          telefono: string | null
          total_resenas: number
          updated_at: string
          user_id: string
          verificado_en: string | null
          verificado_por: string | null
          visitas_permitidas: boolean
          whatsapp: string | null
        }
        Insert: {
          acepta_donaciones?: boolean
          calificacion_promedio?: number
          capacidad_maxima?: number | null
          certificaciones?: Json
          ciudad: string
          country_code?: string
          created_at?: string
          cuenta_comercial_id: string
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          especies_atendidas?: Json
          estado?: string
          facebook?: string | null
          foto_url?: string | null
          fotos_galeria?: Json
          historia?: string | null
          horario_visitas?: Json
          id?: string
          instagram?: string | null
          lat?: number | null
          lon?: number | null
          metadata?: Json
          moneda_donaciones?: string | null
          monto_minimo_donacion?: number | null
          motivo_rechazo?: string | null
          nombre: string
          numero_registro?: string | null
          permisos_legales?: Json
          provincia?: string | null
          sitio_web?: string | null
          telefono?: string | null
          total_resenas?: number
          updated_at?: string
          user_id: string
          verificado_en?: string | null
          verificado_por?: string | null
          visitas_permitidas?: boolean
          whatsapp?: string | null
        }
        Update: {
          acepta_donaciones?: boolean
          calificacion_promedio?: number
          capacidad_maxima?: number | null
          certificaciones?: Json
          ciudad?: string
          country_code?: string
          created_at?: string
          cuenta_comercial_id?: string
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          especies_atendidas?: Json
          estado?: string
          facebook?: string | null
          foto_url?: string | null
          fotos_galeria?: Json
          historia?: string | null
          horario_visitas?: Json
          id?: string
          instagram?: string | null
          lat?: number | null
          lon?: number | null
          metadata?: Json
          moneda_donaciones?: string | null
          monto_minimo_donacion?: number | null
          motivo_rechazo?: string | null
          nombre?: string
          numero_registro?: string | null
          permisos_legales?: Json
          provincia?: string | null
          sitio_web?: string | null
          telefono?: string | null
          total_resenas?: number
          updated_at?: string
          user_id?: string
          verificado_en?: string | null
          verificado_por?: string | null
          visitas_permitidas?: boolean
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refugios_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refugios_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
          {
            foreignKeyName: "refugios_verificado_por_fkey"
            columns: ["verificado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refugios_verificado_por_fkey"
            columns: ["verificado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reportes_programados: {
        Row: {
          activo: boolean
          country_code: string | null
          created_at: string
          descripcion: string | null
          dia_envio: number | null
          emails: Json
          error_ultimo: string | null
          filtros: Json | null
          frecuencia: string
          hora_envio: string
          id: string
          nombre: string
          proximo_envio: string | null
          tipo: string
          ultimo_envio: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          country_code?: string | null
          created_at?: string
          descripcion?: string | null
          dia_envio?: number | null
          emails?: Json
          error_ultimo?: string | null
          filtros?: Json | null
          frecuencia: string
          hora_envio?: string
          id?: string
          nombre: string
          proximo_envio?: string | null
          tipo: string
          ultimo_envio?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          country_code?: string | null
          created_at?: string
          descripcion?: string | null
          dia_envio?: number | null
          emails?: Json
          error_ultimo?: string | null
          filtros?: Json | null
          frecuencia?: string
          hora_envio?: string
          id?: string
          nombre?: string
          proximo_envio?: string | null
          tipo?: string
          ultimo_envio?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resenas_productos: {
        Row: {
          calificacion: number
          comentario: string | null
          created_at: string
          es_visible: boolean
          fotos: Json | null
          id: string
          mascota_id: string | null
          pedido_id: string | null
          producto_id: string
          titulo: string | null
          user_id: string
        }
        Insert: {
          calificacion: number
          comentario?: string | null
          created_at?: string
          es_visible?: boolean
          fotos?: Json | null
          id?: string
          mascota_id?: string | null
          pedido_id?: string | null
          producto_id: string
          titulo?: string | null
          user_id: string
        }
        Update: {
          calificacion?: number
          comentario?: string | null
          created_at?: string
          es_visible?: boolean
          fotos?: Json | null
          id?: string
          mascota_id?: string | null
          pedido_id?: string | null
          producto_id?: string
          titulo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resenas_productos_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resenas_productos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resenas_productos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_logistico"
            referencedColumns: ["pedido_id"]
          },
          {
            foreignKeyName: "resenas_productos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resenas_productos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resenas_productos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      restricciones_mascota_activas: {
        Row: {
          antecedente_origen: Json
          created_at: string
          estado: string
          familia_servicio: string
          id: string
          mascota_id: string
          restriccion_catalogo_id: string
          severidad: string
          updated_at: string
          vigente_desde: string
          vigente_hasta: string | null
        }
        Insert: {
          antecedente_origen?: Json
          created_at?: string
          estado?: string
          familia_servicio: string
          id?: string
          mascota_id: string
          restriccion_catalogo_id: string
          severidad: string
          updated_at?: string
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Update: {
          antecedente_origen?: Json
          created_at?: string
          estado?: string
          familia_servicio?: string
          id?: string
          mascota_id?: string
          restriccion_catalogo_id?: string
          severidad?: string
          updated_at?: string
          vigente_desde?: string
          vigente_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restricciones_mascota_activas_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restricciones_mascota_activas_restriccion_catalogo_id_fkey"
            columns: ["restriccion_catalogo_id"]
            isOneToOne: false
            referencedRelation: "cat_restricciones_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      seguidores: {
        Row: {
          created_at: string
          id: string
          seguido_id: string
          seguidor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          seguido_id: string
          seguidor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          seguido_id?: string
          seguidor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguidores_seguido_id_fkey"
            columns: ["seguido_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguidores_seguido_id_fkey"
            columns: ["seguido_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "seguidores_seguidor_id_fkey"
            columns: ["seguidor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguidores_seguidor_id_fkey"
            columns: ["seguidor_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      seguro_planes: {
        Row: {
          activo: boolean
          aseguradora: string
          cobertura_detalle: Json | null
          country_code: string
          created_at: string
          deducible_usd: number | null
          descripcion: string | null
          exclusiones: Json | null
          id: string
          nombre: string
          orden_display: number | null
          precio_mensual_gato_adulto: number | null
          precio_mensual_gato_joven: number | null
          precio_mensual_gato_senior: number | null
          precio_mensual_perro_adulto: number | null
          precio_mensual_perro_joven: number | null
          precio_mensual_perro_senior: number | null
          tipo_cobertura: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          aseguradora: string
          cobertura_detalle?: Json | null
          country_code?: string
          created_at?: string
          deducible_usd?: number | null
          descripcion?: string | null
          exclusiones?: Json | null
          id?: string
          nombre: string
          orden_display?: number | null
          precio_mensual_gato_adulto?: number | null
          precio_mensual_gato_joven?: number | null
          precio_mensual_gato_senior?: number | null
          precio_mensual_perro_adulto?: number | null
          precio_mensual_perro_joven?: number | null
          precio_mensual_perro_senior?: number | null
          tipo_cobertura: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          aseguradora?: string
          cobertura_detalle?: Json | null
          country_code?: string
          created_at?: string
          deducible_usd?: number | null
          descripcion?: string | null
          exclusiones?: Json | null
          id?: string
          nombre?: string
          orden_display?: number | null
          precio_mensual_gato_adulto?: number | null
          precio_mensual_gato_joven?: number | null
          precio_mensual_gato_senior?: number | null
          precio_mensual_perro_adulto?: number | null
          precio_mensual_perro_joven?: number | null
          precio_mensual_perro_senior?: number | null
          tipo_cobertura?: string
          updated_at?: string
        }
        Relationships: []
      }
      seguro_polizas: {
        Row: {
          auto_renovar: boolean
          country_code: string
          created_at: string
          estado: string
          id: string
          inicio_en: string
          kushki_token: string | null
          mascota_id: string
          monto_reclamado: number | null
          numero_poliza: string | null
          plan_id: string
          poliza_externa_id: string | null
          precio_mensual: number
          proximo_pago_en: string | null
          total_siniestros: number | null
          ultimo_pago_en: string | null
          updated_at: string
          user_id: string
          vence_en: string
        }
        Insert: {
          auto_renovar?: boolean
          country_code?: string
          created_at?: string
          estado?: string
          id?: string
          inicio_en?: string
          kushki_token?: string | null
          mascota_id: string
          monto_reclamado?: number | null
          numero_poliza?: string | null
          plan_id: string
          poliza_externa_id?: string | null
          precio_mensual: number
          proximo_pago_en?: string | null
          total_siniestros?: number | null
          ultimo_pago_en?: string | null
          updated_at?: string
          user_id: string
          vence_en: string
        }
        Update: {
          auto_renovar?: boolean
          country_code?: string
          created_at?: string
          estado?: string
          id?: string
          inicio_en?: string
          kushki_token?: string | null
          mascota_id?: string
          monto_reclamado?: number | null
          numero_poliza?: string | null
          plan_id?: string
          poliza_externa_id?: string | null
          precio_mensual?: number
          proximo_pago_en?: string | null
          total_siniestros?: number | null
          ultimo_pago_en?: string | null
          updated_at?: string
          user_id?: string
          vence_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguro_polizas_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguro_polizas_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "seguro_planes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguro_polizas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguro_polizas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      seguro_siniestros: {
        Row: {
          cita_id: string | null
          created_at: string
          descripcion: string
          documentos: Json | null
          estado: string
          fecha_incidente: string
          id: string
          mascota_id: string
          monto_aprobado: number | null
          monto_reclamado: number
          notas_aseguradora: string | null
          poliza_id: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cita_id?: string | null
          created_at?: string
          descripcion: string
          documentos?: Json | null
          estado?: string
          fecha_incidente: string
          id?: string
          mascota_id: string
          monto_aprobado?: number | null
          monto_reclamado: number
          notas_aseguradora?: string | null
          poliza_id: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cita_id?: string | null
          created_at?: string
          descripcion?: string
          documentos?: Json | null
          estado?: string
          fecha_incidente?: string
          id?: string
          mascota_id?: string
          monto_aprobado?: number | null
          monto_reclamado?: number
          notas_aseguradora?: string | null
          poliza_id?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguro_siniestros_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "evento_cita_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguro_siniestros_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguro_siniestros_poliza_id_fkey"
            columns: ["poliza_id"]
            isOneToOne: false
            referencedRelation: "seguro_polizas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguro_siniestros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguro_siniestros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      seller_comisiones: {
        Row: {
          activo: boolean
          categoria: string | null
          country_code: string | null
          created_at: string
          es_override: boolean
          id: string
          notas: string | null
          producto_id: string | null
          seller_id: string
          take_rate_pct: number
          tipo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          categoria?: string | null
          country_code?: string | null
          created_at?: string
          es_override?: boolean
          id?: string
          notas?: string | null
          producto_id?: string | null
          seller_id: string
          take_rate_pct?: number
          tipo: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          categoria?: string | null
          country_code?: string | null
          created_at?: string
          es_override?: boolean
          id?: string
          notas?: string | null
          producto_id?: string | null
          seller_id?: string
          take_rate_pct?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_comisiones_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_comisiones_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      seller_documentos: {
        Row: {
          archivo_url: string
          created_at: string
          estado: string
          id: string
          nombre: string
          notas: string | null
          revisado_en: string | null
          revisado_por: string | null
          seller_id: string
          tipo: string
        }
        Insert: {
          archivo_url: string
          created_at?: string
          estado?: string
          id?: string
          nombre: string
          notas?: string | null
          revisado_en?: string | null
          revisado_por?: string | null
          seller_id: string
          tipo: string
        }
        Update: {
          archivo_url?: string
          created_at?: string
          estado?: string
          id?: string
          nombre?: string
          notas?: string | null
          revisado_en?: string | null
          revisado_por?: string | null
          seller_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_documentos_revisado_por_fkey"
            columns: ["revisado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_documentos_revisado_por_fkey"
            columns: ["revisado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "seller_documentos_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_inventario: {
        Row: {
          acepta_pedidos: boolean
          activo: boolean
          ciudad: string | null
          costo_seller: number | null
          country_code: string
          created_at: string
          id: string
          precio_seller: number | null
          producto_id: string
          seller_id: string
          stock_disponible: number
          stock_minimo: number
          stock_reservado: number
          tiempo_despacho_dias: number | null
          updated_at: string
        }
        Insert: {
          acepta_pedidos?: boolean
          activo?: boolean
          ciudad?: string | null
          costo_seller?: number | null
          country_code?: string
          created_at?: string
          id?: string
          precio_seller?: number | null
          producto_id: string
          seller_id: string
          stock_disponible?: number
          stock_minimo?: number
          stock_reservado?: number
          tiempo_despacho_dias?: number | null
          updated_at?: string
        }
        Update: {
          acepta_pedidos?: boolean
          activo?: boolean
          ciudad?: string | null
          costo_seller?: number | null
          country_code?: string
          created_at?: string
          id?: string
          precio_seller?: number | null
          producto_id?: string
          seller_id?: string
          stock_disponible?: number
          stock_minimo?: number
          stock_reservado?: number
          tiempo_despacho_dias?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_inventario_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_inventario_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_inventario_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      seller_liquidaciones: {
        Row: {
          ajustes: number
          aprobado_en: string | null
          aprobado_por: string | null
          archivo_url: string | null
          comision_plataforma: number
          country_code: string
          created_at: string
          disputa_motivo: string | null
          disputa_respuesta: string | null
          estado: string
          gmv_bruto: number
          id: string
          metodo_pago: string | null
          monto_a_pagar: number
          notas_admin: string | null
          numero_liquidacion: string
          pagado_en: string | null
          pedidos_count: number
          periodo_fin: string
          periodo_inicio: string
          referencia_transferencia: string | null
          seller_id: string
          take_rate_pct: number
          updated_at: string
        }
        Insert: {
          ajustes?: number
          aprobado_en?: string | null
          aprobado_por?: string | null
          archivo_url?: string | null
          comision_plataforma?: number
          country_code?: string
          created_at?: string
          disputa_motivo?: string | null
          disputa_respuesta?: string | null
          estado?: string
          gmv_bruto?: number
          id?: string
          metodo_pago?: string | null
          monto_a_pagar?: number
          notas_admin?: string | null
          numero_liquidacion?: string
          pagado_en?: string | null
          pedidos_count?: number
          periodo_fin: string
          periodo_inicio: string
          referencia_transferencia?: string | null
          seller_id: string
          take_rate_pct?: number
          updated_at?: string
        }
        Update: {
          ajustes?: number
          aprobado_en?: string | null
          aprobado_por?: string | null
          archivo_url?: string | null
          comision_plataforma?: number
          country_code?: string
          created_at?: string
          disputa_motivo?: string | null
          disputa_respuesta?: string | null
          estado?: string
          gmv_bruto?: number
          id?: string
          metodo_pago?: string | null
          monto_a_pagar?: number
          notas_admin?: string | null
          numero_liquidacion?: string
          pagado_en?: string | null
          pedidos_count?: number
          periodo_fin?: string
          periodo_inicio?: string
          referencia_transferencia?: string | null
          seller_id?: string
          take_rate_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_liquidaciones_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_liquidaciones_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "seller_liquidaciones_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_liquidaciones_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      seller_perfil: {
        Row: {
          aprobado_en: string | null
          aprobado_por: string | null
          banner_url: string | null
          calificacion_promedio: number | null
          ciudad_despacho: string | null
          cobertura_geografica: string | null
          codigo_afiliado: string | null
          country_code: string
          created_at: string
          cuenta_comercial_id: string
          descripcion: string | null
          despacho_aprobado: boolean | null
          despacho_propio: boolean | null
          direccion_despacho: string | null
          email_contacto: string | null
          envio_gratis_desde: number | null
          estado: string
          id: string
          lat: number | null
          logo_url: string | null
          lon: number | null
          nombre_comercial: string
          paises_operacion: Json | null
          politica_devolucion: string | null
          requiere_aprobacion_despacho: boolean | null
          telefono: string | null
          tiempo_entrega_dias: number | null
          tiempo_preparacion_horas: number | null
          total_resenas: number | null
          total_ventas: number | null
          transportistas_propios: string | null
          updated_at: string
          user_id: string
          vtex_app_key_ref: string | null
          vtex_app_token_ref: string | null
          vtex_estado_sync: string | null
          vtex_fulfillment_url: string | null
          vtex_seller_id: string | null
          vtex_sync_error: string | null
          vtex_trade_policy_id: string | null
          vtex_ultima_sync: string | null
          whatsapp: string | null
        }
        Insert: {
          aprobado_en?: string | null
          aprobado_por?: string | null
          banner_url?: string | null
          calificacion_promedio?: number | null
          ciudad_despacho?: string | null
          cobertura_geografica?: string | null
          codigo_afiliado?: string | null
          country_code?: string
          created_at?: string
          cuenta_comercial_id: string
          descripcion?: string | null
          despacho_aprobado?: boolean | null
          despacho_propio?: boolean | null
          direccion_despacho?: string | null
          email_contacto?: string | null
          envio_gratis_desde?: number | null
          estado?: string
          id?: string
          lat?: number | null
          logo_url?: string | null
          lon?: number | null
          nombre_comercial: string
          paises_operacion?: Json | null
          politica_devolucion?: string | null
          requiere_aprobacion_despacho?: boolean | null
          telefono?: string | null
          tiempo_entrega_dias?: number | null
          tiempo_preparacion_horas?: number | null
          total_resenas?: number | null
          total_ventas?: number | null
          transportistas_propios?: string | null
          updated_at?: string
          user_id: string
          vtex_app_key_ref?: string | null
          vtex_app_token_ref?: string | null
          vtex_estado_sync?: string | null
          vtex_fulfillment_url?: string | null
          vtex_seller_id?: string | null
          vtex_sync_error?: string | null
          vtex_trade_policy_id?: string | null
          vtex_ultima_sync?: string | null
          whatsapp?: string | null
        }
        Update: {
          aprobado_en?: string | null
          aprobado_por?: string | null
          banner_url?: string | null
          calificacion_promedio?: number | null
          ciudad_despacho?: string | null
          cobertura_geografica?: string | null
          codigo_afiliado?: string | null
          country_code?: string
          created_at?: string
          cuenta_comercial_id?: string
          descripcion?: string | null
          despacho_aprobado?: boolean | null
          despacho_propio?: boolean | null
          direccion_despacho?: string | null
          email_contacto?: string | null
          envio_gratis_desde?: number | null
          estado?: string
          id?: string
          lat?: number | null
          logo_url?: string | null
          lon?: number | null
          nombre_comercial?: string
          paises_operacion?: Json | null
          politica_devolucion?: string | null
          requiere_aprobacion_despacho?: boolean | null
          telefono?: string | null
          tiempo_entrega_dias?: number | null
          tiempo_preparacion_horas?: number | null
          total_resenas?: number | null
          total_ventas?: number | null
          transportistas_propios?: string | null
          updated_at?: string
          user_id?: string
          vtex_app_key_ref?: string | null
          vtex_app_token_ref?: string | null
          vtex_estado_sync?: string | null
          vtex_fulfillment_url?: string | null
          vtex_seller_id?: string | null
          vtex_sync_error?: string | null
          vtex_trade_policy_id?: string | null
          vtex_ultima_sync?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_perfil_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_perfil_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "seller_perfil_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_perfil_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
          {
            foreignKeyName: "seller_perfil_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_perfil_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      seller_reglas_asignacion: {
        Row: {
          country_code: string
          fallback_accion: string
          id: string
          permitir_split: boolean
          prioridad_1: string
          prioridad_2: string | null
          prioridad_3: string | null
          radio_maximo_km: number | null
          updated_at: string
        }
        Insert: {
          country_code?: string
          fallback_accion?: string
          id?: string
          permitir_split?: boolean
          prioridad_1?: string
          prioridad_2?: string | null
          prioridad_3?: string | null
          radio_maximo_km?: number | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          fallback_accion?: string
          id?: string
          permitir_split?: boolean
          prioridad_1?: string
          prioridad_2?: string | null
          prioridad_3?: string | null
          radio_maximo_km?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      servicios_exequiales: {
        Row: {
          certificado_url: string | null
          country_code: string
          created_at: string
          direccion_recogida: string | null
          estado: string
          fecha_servicio: string | null
          id: string
          mascota_id: string
          memorial_url: string | null
          notas_especiales: string | null
          pagado: boolean | null
          pedido_id: string | null
          precio_total: number | null
          prestador_id: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          certificado_url?: string | null
          country_code?: string
          created_at?: string
          direccion_recogida?: string | null
          estado?: string
          fecha_servicio?: string | null
          id?: string
          mascota_id: string
          memorial_url?: string | null
          notas_especiales?: string | null
          pagado?: boolean | null
          pedido_id?: string | null
          precio_total?: number | null
          prestador_id?: string | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          certificado_url?: string | null
          country_code?: string
          created_at?: string
          direccion_recogida?: string | null
          estado?: string
          fecha_servicio?: string | null
          id?: string
          mascota_id?: string
          memorial_url?: string | null
          notas_especiales?: string | null
          pagado?: boolean | null
          pedido_id?: string | null
          precio_total?: number | null
          prestador_id?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_exequiales_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_exequiales_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_exequiales_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_logistico"
            referencedColumns: ["pedido_id"]
          },
          {
            foreignKeyName: "servicios_exequiales_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_exequiales_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_exequiales_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_exequiales_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      solicitudes_adopcion: {
        Row: {
          aprobado_en: string | null
          aprobado_por: string | null
          created_at: string | null
          email: string | null
          entrevista_fecha: string | null
          entrevista_notas: string | null
          entrevista_requerida: boolean | null
          entrevista_resultado: string | null
          espacio_exterior: boolean | null
          estado: string
          id: string
          mascota_nombre: string | null
          motivo: string | null
          motivo_rechazo: string | null
          nombre_solicitante: string | null
          refugio_id: string | null
          score_breakdown: Json | null
          score_calculado_en: string | null
          score_compatibilidad: number | null
          telefono: string | null
          tiene_mascotas: boolean | null
          user_id: string | null
        }
        Insert: {
          aprobado_en?: string | null
          aprobado_por?: string | null
          created_at?: string | null
          email?: string | null
          entrevista_fecha?: string | null
          entrevista_notas?: string | null
          entrevista_requerida?: boolean | null
          entrevista_resultado?: string | null
          espacio_exterior?: boolean | null
          estado?: string
          id?: string
          mascota_nombre?: string | null
          motivo?: string | null
          motivo_rechazo?: string | null
          nombre_solicitante?: string | null
          refugio_id?: string | null
          score_breakdown?: Json | null
          score_calculado_en?: string | null
          score_compatibilidad?: number | null
          telefono?: string | null
          tiene_mascotas?: boolean | null
          user_id?: string | null
        }
        Update: {
          aprobado_en?: string | null
          aprobado_por?: string | null
          created_at?: string | null
          email?: string | null
          entrevista_fecha?: string | null
          entrevista_notas?: string | null
          entrevista_requerida?: boolean | null
          entrevista_resultado?: string | null
          espacio_exterior?: boolean | null
          estado?: string
          id?: string
          mascota_nombre?: string | null
          motivo?: string | null
          motivo_rechazo?: string | null
          nombre_solicitante?: string | null
          refugio_id?: string | null
          score_breakdown?: Json | null
          score_calculado_en?: string | null
          score_compatibilidad?: number | null
          telefono?: string | null
          tiene_mascotas?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_adopcion_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_adopcion_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "solicitudes_adopcion_refugio_id_fkey"
            columns: ["refugio_id"]
            isOneToOne: false
            referencedRelation: "refugios"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_emergencia: {
        Row: {
          asignado_en: string | null
          atendido_en: string | null
          calificacion: number | null
          cita_id: string | null
          comentario: string | null
          completado_en: string | null
          country_code: string
          created_at: string
          descripcion: string
          direccion_texto: string | null
          estado: string
          id: string
          lat: number
          lon: number
          mascota_id: string
          nivel_urgencia: string
          notas_admin: string | null
          prestador_id: string | null
          tiempo_estimado_minutos: number | null
          tipo_emergencia: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asignado_en?: string | null
          atendido_en?: string | null
          calificacion?: number | null
          cita_id?: string | null
          comentario?: string | null
          completado_en?: string | null
          country_code?: string
          created_at?: string
          descripcion: string
          direccion_texto?: string | null
          estado?: string
          id?: string
          lat: number
          lon: number
          mascota_id: string
          nivel_urgencia?: string
          notas_admin?: string | null
          prestador_id?: string | null
          tiempo_estimado_minutos?: number | null
          tipo_emergencia: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asignado_en?: string | null
          atendido_en?: string | null
          calificacion?: number | null
          cita_id?: string | null
          comentario?: string | null
          completado_en?: string | null
          country_code?: string
          created_at?: string
          descripcion?: string
          direccion_texto?: string | null
          estado?: string
          id?: string
          lat?: number
          lon?: number
          mascota_id?: string
          nivel_urgencia?: string
          notas_admin?: string | null
          prestador_id?: string | null
          tiempo_estimado_minutos?: number | null
          tipo_emergencia?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_emergencia_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "evento_cita_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_emergencia_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_emergencia_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_emergencia_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_emergencia_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_emergencia_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      suscripciones: {
        Row: {
          auto_renovar: boolean
          cancelada_en: string | null
          country_code: string
          created_at: string
          es_trial: boolean
          estado: string
          id: string
          inicio_en: string
          kushki_token: string | null
          motivo_cancelacion: string | null
          periodo: string
          plan_id: string
          precio_pagado: number
          trial_dias: number | null
          ultimo_pago_en: string | null
          updated_at: string
          user_id: string
          vence_en: string
        }
        Insert: {
          auto_renovar?: boolean
          cancelada_en?: string | null
          country_code?: string
          created_at?: string
          es_trial?: boolean
          estado?: string
          id?: string
          inicio_en?: string
          kushki_token?: string | null
          motivo_cancelacion?: string | null
          periodo?: string
          plan_id: string
          precio_pagado?: number
          trial_dias?: number | null
          ultimo_pago_en?: string | null
          updated_at?: string
          user_id: string
          vence_en: string
        }
        Update: {
          auto_renovar?: boolean
          cancelada_en?: string | null
          country_code?: string
          created_at?: string
          es_trial?: boolean
          estado?: string
          id?: string
          inicio_en?: string
          kushki_token?: string | null
          motivo_cancelacion?: string | null
          periodo?: string
          plan_id?: string
          precio_pagado?: number
          trial_dias?: number | null
          ultimo_pago_en?: string | null
          updated_at?: string
          user_id?: string
          vence_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_prime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      suscripciones_servicio: {
        Row: {
          activado_en: string | null
          auto_renovar: boolean
          cancelado_en: string | null
          country_code: string
          created_at: string
          empleado_id: string | null
          estado: string
          estado_pago: string
          id: string
          kushki_subscription_id: string | null
          mascota_id: string
          motivo_cancelacion: string | null
          notas_prestador: string | null
          observaciones_cliente: string | null
          periodo_fin: string
          periodo_inicio: string
          precio_mensual: number
          precio_pagado: number
          prestador_id: string
          proximo_cobro_en: string | null
          tipo_servicio: string
          ultima_actividad_en: string | null
          unidades_consumidas: number
          user_id: string
        }
        Insert: {
          activado_en?: string | null
          auto_renovar?: boolean
          cancelado_en?: string | null
          country_code?: string
          created_at?: string
          empleado_id?: string | null
          estado?: string
          estado_pago?: string
          id?: string
          kushki_subscription_id?: string | null
          mascota_id: string
          motivo_cancelacion?: string | null
          notas_prestador?: string | null
          observaciones_cliente?: string | null
          periodo_fin: string
          periodo_inicio: string
          precio_mensual: number
          precio_pagado: number
          prestador_id: string
          proximo_cobro_en?: string | null
          tipo_servicio: string
          ultima_actividad_en?: string | null
          unidades_consumidas?: number
          user_id: string
        }
        Update: {
          activado_en?: string | null
          auto_renovar?: boolean
          cancelado_en?: string | null
          country_code?: string
          created_at?: string
          empleado_id?: string | null
          estado?: string
          estado_pago?: string
          id?: string
          kushki_subscription_id?: string | null
          mascota_id?: string
          motivo_cancelacion?: string | null
          notas_prestador?: string | null
          observaciones_cliente?: string | null
          periodo_fin?: string
          periodo_inicio?: string
          precio_mensual?: number
          precio_pagado?: number
          prestador_id?: string
          proximo_cobro_en?: string | null
          tipo_servicio?: string
          ultima_actividad_en?: string | null
          unidades_consumidas?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_servicio_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "prestador_empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_servicio_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_servicio_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_servicio_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "v_prestadores_publicos"
            referencedColumns: ["id"]
          },
        ]
      }
      test_data_registry: {
        Row: {
          created_at: string
          fila_id: string
          funcion_origen: string
          id: string
          metadata: Json
          session_id: string
          tabla: string
        }
        Insert: {
          created_at?: string
          fila_id: string
          funcion_origen: string
          id?: string
          metadata?: Json
          session_id: string
          tabla: string
        }
        Update: {
          created_at?: string
          fila_id?: string
          funcion_origen?: string
          id?: string
          metadata?: Json
          session_id?: string
          tabla?: string
        }
        Relationships: []
      }
      ticket_mensajes: {
        Row: {
          archivos: Json | null
          autor_id: string
          created_at: string
          es_interno: boolean
          id: string
          mensaje: string
          ticket_id: string
        }
        Insert: {
          archivos?: Json | null
          autor_id: string
          created_at?: string
          es_interno?: boolean
          id?: string
          mensaje: string
          ticket_id: string
        }
        Update: {
          archivos?: Json | null
          autor_id?: string
          created_at?: string
          es_interno?: boolean
          id?: string
          mensaje?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_mensajes_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_mensajes_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ticket_mensajes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_soporte"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets_soporte: {
        Row: {
          archivos: Json | null
          asignado_a: string | null
          asignado_en: string | null
          asunto: string
          calificacion_comentario: string | null
          calificacion_soporte: number | null
          canal_origen: string | null
          categoria: string
          cita_id: string | null
          country_code: string
          created_at: string
          descripcion: string
          estado: string
          id: string
          numero_ticket: string
          pedido_id: string | null
          prioridad: string
          resolucion: string | null
          resuelto_en: string | null
          tiempo_primera_respuesta_min: number | null
          tiempo_resolucion_min: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archivos?: Json | null
          asignado_a?: string | null
          asignado_en?: string | null
          asunto: string
          calificacion_comentario?: string | null
          calificacion_soporte?: number | null
          canal_origen?: string | null
          categoria: string
          cita_id?: string | null
          country_code?: string
          created_at?: string
          descripcion: string
          estado?: string
          id?: string
          numero_ticket?: string
          pedido_id?: string | null
          prioridad?: string
          resolucion?: string | null
          resuelto_en?: string | null
          tiempo_primera_respuesta_min?: number | null
          tiempo_resolucion_min?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archivos?: Json | null
          asignado_a?: string | null
          asignado_en?: string | null
          asunto?: string
          calificacion_comentario?: string | null
          calificacion_soporte?: number | null
          canal_origen?: string | null
          categoria?: string
          cita_id?: string | null
          country_code?: string
          created_at?: string
          descripcion?: string
          estado?: string
          id?: string
          numero_ticket?: string
          pedido_id?: string | null
          prioridad?: string
          resolucion?: string | null
          resuelto_en?: string | null
          tiempo_primera_respuesta_min?: number | null
          tiempo_resolucion_min?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_soporte_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_soporte_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tickets_soporte_cita_id_fkey"
            columns: ["cita_id"]
            isOneToOne: false
            referencedRelation: "evento_cita_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_soporte_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_soporte_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_logistico"
            referencedColumns: ["pedido_id"]
          },
          {
            foreignKeyName: "tickets_soporte_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_soporte_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tipos_cambio: {
        Row: {
          created_at: string
          fecha: string
          fuente: string | null
          id: string
          moneda_destino: string
          moneda_origen: string
          tasa: number
        }
        Insert: {
          created_at?: string
          fecha?: string
          fuente?: string | null
          id?: string
          moneda_destino: string
          moneda_origen?: string
          tasa: number
        }
        Update: {
          created_at?: string
          fecha?: string
          fuente?: string | null
          id?: string
          moneda_destino?: string
          moneda_origen?: string
          tasa?: number
        }
        Relationships: []
      }
      tipos_servicio: {
        Row: {
          activo: boolean
          categoria: string
          codigo: string
          country_codes: Json | null
          created_at: string
          descripcion: string | null
          duracion_default_minutos: number | null
          es_medico: boolean | null
          icono: string | null
          id: string
          nombre: string
          orden_display: number | null
          requiere_historia_clinica: boolean | null
          requiere_resultado: boolean | null
          requiere_validacion_admin: boolean
        }
        Insert: {
          activo?: boolean
          categoria: string
          codigo: string
          country_codes?: Json | null
          created_at?: string
          descripcion?: string | null
          duracion_default_minutos?: number | null
          es_medico?: boolean | null
          icono?: string | null
          id?: string
          nombre: string
          orden_display?: number | null
          requiere_historia_clinica?: boolean | null
          requiere_resultado?: boolean | null
          requiere_validacion_admin?: boolean
        }
        Update: {
          activo?: boolean
          categoria?: string
          codigo?: string
          country_codes?: Json | null
          created_at?: string
          descripcion?: string | null
          duracion_default_minutos?: number | null
          es_medico?: boolean | null
          icono?: string | null
          id?: string
          nombre?: string
          orden_display?: number | null
          requiere_historia_clinica?: boolean | null
          requiere_resultado?: boolean | null
          requiere_validacion_admin?: boolean
        }
        Relationships: []
      }
      transacciones_puntos: {
        Row: {
          created_at: string
          descripcion: string
          id: string
          logro_id: string | null
          puntos: number
          referencia_id: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          id?: string
          logro_id?: string | null
          puntos: number
          referencia_id?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          id?: string
          logro_id?: string | null
          puntos?: number
          referencia_id?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_puntos_logro_id_fkey"
            columns: ["logro_id"]
            isOneToOne: false
            referencedRelation: "logros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_puntos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_puntos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_notificacion_prefs: {
        Row: {
          habilitada: boolean
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          habilitada?: boolean
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          habilitada?: boolean
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferencias: {
        Row: {
          idioma: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          idioma?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          idioma?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          country_code: string | null
          created_at: string
          id: string
          is_active: boolean
          role: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          role: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vtex_sync_log: {
        Row: {
          completado_at: string | null
          created_at: string
          entidad_id: string | null
          error_mensaje: string | null
          estado: string
          id: string
          intentos: number
          request_payload: Json | null
          response_payload: Json | null
          tipo: string
          vtex_id: string | null
        }
        Insert: {
          completado_at?: string | null
          created_at?: string
          entidad_id?: string | null
          error_mensaje?: string | null
          estado: string
          id?: string
          intentos?: number
          request_payload?: Json | null
          response_payload?: Json | null
          tipo: string
          vtex_id?: string | null
        }
        Update: {
          completado_at?: string | null
          created_at?: string
          entidad_id?: string | null
          error_mensaje?: string | null
          estado?: string
          id?: string
          intentos?: number
          request_payload?: Json | null
          response_payload?: Json | null
          tipo?: string
          vtex_id?: string | null
        }
        Relationships: []
      }
      wearable_alerts: {
        Row: {
          alert_type: string
          device_id: string
          evento_id: string | null
          id: string
          is_read: boolean
          message: string
          owner_id: string
          pet_id: string
          read_at: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          suggested_action: string | null
          telemetry_snapshot: Json | null
          title: string
          triggered_at: string
        }
        Insert: {
          alert_type: string
          device_id: string
          evento_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          owner_id: string
          pet_id: string
          read_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          suggested_action?: string | null
          telemetry_snapshot?: Json | null
          title: string
          triggered_at?: string
        }
        Update: {
          alert_type?: string
          device_id?: string
          evento_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          owner_id?: string
          pet_id?: string
          read_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          suggested_action?: string | null
          telemetry_snapshot?: Json | null
          title?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wearable_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "wearable_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wearable_alerts_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: true
            referencedRelation: "eventos_mascota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wearable_alerts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wearable_alerts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wearable_alerts_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_devices: {
        Row: {
          battery_pct: number | null
          country_code: string
          created_at: string
          device_model: string
          device_serial: string
          firmware_version: string | null
          id: string
          is_active: boolean
          last_lat: number | null
          last_lon: number | null
          last_seen_at: string | null
          owner_id: string
          paired_at: string
          pet_id: string
          updated_at: string
        }
        Insert: {
          battery_pct?: number | null
          country_code?: string
          created_at?: string
          device_model?: string
          device_serial: string
          firmware_version?: string | null
          id?: string
          is_active?: boolean
          last_lat?: number | null
          last_lon?: number | null
          last_seen_at?: string | null
          owner_id: string
          paired_at?: string
          pet_id: string
          updated_at?: string
        }
        Update: {
          battery_pct?: number | null
          country_code?: string
          created_at?: string
          device_model?: string
          device_serial?: string
          firmware_version?: string | null
          id?: string
          is_active?: boolean
          last_lat?: number | null
          last_lon?: number | null
          last_seen_at?: string | null
          owner_id?: string
          paired_at?: string
          pet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wearable_devices_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wearable_devices_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wearable_devices_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_telemetry: {
        Row: {
          activity_level: string | null
          battery_pct: number | null
          device_id: string
          heart_rate: number | null
          id: string
          lat: number | null
          location_accuracy_m: number | null
          lon: number | null
          pet_id: string
          recorded_at: string
          signal_strength: number | null
          steps: number | null
          synced_at: string
        }
        Insert: {
          activity_level?: string | null
          battery_pct?: number | null
          device_id: string
          heart_rate?: number | null
          id?: string
          lat?: number | null
          location_accuracy_m?: number | null
          lon?: number | null
          pet_id: string
          recorded_at: string
          signal_strength?: number | null
          steps?: number | null
          synced_at?: string
        }
        Update: {
          activity_level?: string | null
          battery_pct?: number | null
          device_id?: string
          heart_rate?: number | null
          id?: string
          lat?: number | null
          location_accuracy_m?: number | null
          lon?: number | null
          pet_id?: string
          recorded_at?: string
          signal_strength?: number | null
          steps?: number | null
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wearable_telemetry_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "wearable_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wearable_telemetry_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_zones: {
        Row: {
          alert_on_enter: boolean
          alert_on_exit: boolean
          center_lat: number
          center_lon: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          owner_id: string
          pet_id: string | null
          radius_meters: number
        }
        Insert: {
          alert_on_enter?: boolean
          alert_on_exit?: boolean
          center_lat: number
          center_lon: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          owner_id: string
          pet_id?: string | null
          radius_meters?: number
        }
        Update: {
          alert_on_enter?: boolean
          alert_on_exit?: boolean
          center_lat?: number
          center_lon?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          pet_id?: string | null
          radius_meters?: number
        }
        Relationships: [
          {
            foreignKeyName: "wearable_zones_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wearable_zones_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wearable_zones_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          producto_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          producto_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          producto_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      zonas_cobertura: {
        Row: {
          activo: boolean
          ciudad: string
          country_code: string
          created_at: string
          id: string
          sector: string | null
          tarifa_base: number
          tarifa_kg: number | null
          tiempo_estimado_horas: number | null
          transportista: string
        }
        Insert: {
          activo?: boolean
          ciudad: string
          country_code?: string
          created_at?: string
          id?: string
          sector?: string | null
          tarifa_base?: number
          tarifa_kg?: number | null
          tiempo_estimado_horas?: number | null
          transportista: string
        }
        Update: {
          activo?: boolean
          ciudad?: string
          country_code?: string
          created_at?: string
          id?: string
          sector?: string | null
          tarifa_base?: number
          tarifa_kg?: number | null
          tiempo_estimado_horas?: number | null
          transportista?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_conversion_funnel: {
        Row: {
          carritos: number | null
          checkouts: number | null
          country_code: string | null
          dia: string | null
          mascotas_agregadas: number | null
          pedidos_completados: number | null
          registros: number | null
          servicios_agendados: number | null
          suscripciones_prime: number | null
        }
        Relationships: []
      }
      v_crecimiento_usuarios: {
        Row: {
          mes: string | null
          usuarios_acumulados: number | null
          usuarios_nuevos: number | null
        }
        Relationships: []
      }
      v_criaderos_publicos: {
        Row: {
          cachorros_disponibles: number | null
          calificacion_promedio: number | null
          camadas_disponibles: number | null
          ciudad: string | null
          country_code: string | null
          descripcion: string | null
          entrega_con_microchip: boolean | null
          entrega_con_vacunas: boolean | null
          especies: Json | null
          estado: string | null
          foto_url: string | null
          garantia_salud_meses: number | null
          hace_pruebas_geneticas: boolean | null
          id: string | null
          nombre: string | null
          plan: string | null
          razas: Json | null
          total_resenas: number | null
        }
        Relationships: []
      }
      v_daas_eligible_users: {
        Row: {
          country_code: string | null
          daas_consent_at: string | null
          daas_consent_version: string | null
          pais_codigo: string | null
          user_id: string | null
        }
        Relationships: []
      }
      v_dashboard_logistico: {
        Row: {
          cliente_email: string | null
          cliente_nombre: string | null
          country_code: string | null
          created_at: string | null
          destino_ciudad: string | null
          entrega_hora_fin: string | null
          entrega_hora_inicio: string | null
          entregado_en: string | null
          envio_id: string | null
          estado_envio: string | null
          estado_pedido: string | null
          fuera_sla: boolean | null
          intentos_entrega: number | null
          numero_orden: string | null
          pedido_id: string | null
          total: number | null
          tracking_code: string | null
          transportista: string | null
        }
        Relationships: []
      }
      v_eventos_con_origen: {
        Row: {
          cohorte_periodo: string | null
          country_code: string | null
          created_at: string | null
          cuenta_comercial_id: string | null
          estado:
            | Database["public"]["Enums"]["estado_evento_economico_enum"]
            | null
          evento_original_id: string | null
          fecha_cobro_kushki: string | null
          fecha_devengo: string | null
          fee_calculo_detalle: Json | null
          fee_config_id: string | null
          id: string | null
          kushki_charge_id: string | null
          liquidacion_id: string | null
          metadata: Json | null
          moneda: string | null
          monto_bruto: number | null
          monto_kushki_fee: number | null
          monto_payout: number | null
          monto_plataforma: number | null
          notas_admin: string | null
          origen_data: Json | null
          origen_id: string | null
          origen_tipo: string | null
          parent_evento_id: string | null
          revenue_stream:
            | Database["public"]["Enums"]["revenue_stream_enum"]
            | null
          reversado_por_evento_id: string | null
          tipo_evento:
            | Database["public"]["Enums"]["tipo_evento_economico_enum"]
            | null
          updated_at: string | null
        }
        Insert: {
          cohorte_periodo?: string | null
          country_code?: string | null
          created_at?: string | null
          cuenta_comercial_id?: string | null
          estado?:
            | Database["public"]["Enums"]["estado_evento_economico_enum"]
            | null
          evento_original_id?: string | null
          fecha_cobro_kushki?: string | null
          fecha_devengo?: string | null
          fee_calculo_detalle?: Json | null
          fee_config_id?: string | null
          id?: string | null
          kushki_charge_id?: string | null
          liquidacion_id?: string | null
          metadata?: Json | null
          moneda?: string | null
          monto_bruto?: number | null
          monto_kushki_fee?: number | null
          monto_payout?: number | null
          monto_plataforma?: number | null
          notas_admin?: string | null
          origen_data?: never
          origen_id?: string | null
          origen_tipo?: string | null
          parent_evento_id?: string | null
          revenue_stream?:
            | Database["public"]["Enums"]["revenue_stream_enum"]
            | null
          reversado_por_evento_id?: string | null
          tipo_evento?:
            | Database["public"]["Enums"]["tipo_evento_economico_enum"]
            | null
          updated_at?: string | null
        }
        Update: {
          cohorte_periodo?: string | null
          country_code?: string | null
          created_at?: string | null
          cuenta_comercial_id?: string | null
          estado?:
            | Database["public"]["Enums"]["estado_evento_economico_enum"]
            | null
          evento_original_id?: string | null
          fecha_cobro_kushki?: string | null
          fecha_devengo?: string | null
          fee_calculo_detalle?: Json | null
          fee_config_id?: string | null
          id?: string | null
          kushki_charge_id?: string | null
          liquidacion_id?: string | null
          metadata?: Json | null
          moneda?: string | null
          monto_bruto?: number | null
          monto_kushki_fee?: number | null
          monto_payout?: number | null
          monto_plataforma?: number | null
          notas_admin?: string | null
          origen_data?: never
          origen_id?: string | null
          origen_tipo?: string | null
          parent_evento_id?: string | null
          revenue_stream?:
            | Database["public"]["Enums"]["revenue_stream_enum"]
            | null
          reversado_por_evento_id?: string | null
          tipo_evento?:
            | Database["public"]["Enums"]["tipo_evento_economico_enum"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_economicos_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_economicos_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
          {
            foreignKeyName: "eventos_economicos_evento_original_id_fkey"
            columns: ["evento_original_id"]
            isOneToOne: false
            referencedRelation: "eventos_economicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_economicos_evento_original_id_fkey"
            columns: ["evento_original_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_con_origen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_economicos_fee_config_id_fkey"
            columns: ["fee_config_id"]
            isOneToOne: false
            referencedRelation: "fee_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_economicos_parent_evento_id_fkey"
            columns: ["parent_evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_economicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_economicos_parent_evento_id_fkey"
            columns: ["parent_evento_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_con_origen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_economicos_reversado_por_evento_id_fkey"
            columns: ["reversado_por_evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_economicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_economicos_reversado_por_evento_id_fkey"
            columns: ["reversado_por_evento_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_con_origen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_eventos_liquidacion"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "liquidaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_eventos_liquidacion"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "v_liquidaciones_pendientes_pago"
            referencedColumns: ["id"]
          },
        ]
      }
      v_eventos_resumen_cuenta: {
        Row: {
          country_code: string | null
          cuenta_comercial_id: string | null
          cuenta_estado:
            | Database["public"]["Enums"]["estado_cuenta_comercial_enum"]
            | null
          eventos_liquidados_count: number | null
          eventos_pendientes_count: number | null
          moneda: string | null
          monto_payout_liquidado_total: number | null
          monto_payout_pendiente: number | null
          nombre_comercial: string | null
          razon_social: string | null
          revenue_plataforma_pendiente: number | null
          roles_activos: string[] | null
          saldo_arrastre: number | null
          ultima_actividad: string | null
        }
        Relationships: []
      }
      v_gmv_mensual: {
        Row: {
          country_code: string | null
          gmv: number | null
          mes: string | null
          pedidos: number | null
          revenue: number | null
          ticket_promedio: number | null
        }
        Relationships: []
      }
      v_liquidaciones_pendientes_pago: {
        Row: {
          aprobado_en: string | null
          aprobado_por: string | null
          country_code: string | null
          cuenta_comercial_id: string | null
          datos_bancarios: Json | null
          dias_desde_aprobacion: number | null
          estado: Database["public"]["Enums"]["estado_liquidacion_enum"] | null
          eventos_count: number | null
          id: string | null
          moneda: string | null
          monto_neto_a_pagar: number | null
          nombre_comercial: string | null
          numero_liquidacion: string | null
          periodo_fin: string | null
          periodo_inicio: string | null
          razon_social: string | null
          roles_activos: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "liquidaciones_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidaciones_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "liquidaciones_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "cuentas_comerciales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidaciones_cuenta_comercial_id_fkey"
            columns: ["cuenta_comercial_id"]
            isOneToOne: false
            referencedRelation: "v_eventos_resumen_cuenta"
            referencedColumns: ["cuenta_comercial_id"]
          },
        ]
      }
      v_metricas_tiempo_real: {
        Row: {
          calculado_en: string | null
          citas_mes: number | null
          gmv_crecimiento_pct: number | null
          gmv_hoy: number | null
          gmv_mes: number | null
          mascotas_total: number | null
          mau: number | null
          pedidos_hoy: number | null
          pedidos_mes: number | null
          revenue_mes: number | null
          ticket_promedio: number | null
          usuarios_nuevos_mes: number | null
        }
        Relationships: []
      }
      v_mrr: {
        Row: {
          cancelaciones_mes: number | null
          mrr_anual_prorrateado: number | null
          mrr_mensual: number | null
          mrr_total: number | null
          nuevas_mes: number | null
          suscripciones_activas: number | null
        }
        Relationships: []
      }
      v_pedido_liquidacion: {
        Row: {
          cantidad: number | null
          country_code: string | null
          estado_item: string | null
          estado_liquidacion: string | null
          estado_pedido: string | null
          item_id: string | null
          liquidacion_id: string | null
          liquidacion_pagada_en: string | null
          nombre_producto: string | null
          numero_liquidacion: string | null
          numero_orden: string | null
          origen_datos: string | null
          pedido_id: string | null
          pedido_pagado_en: string | null
          periodo_fin: string | null
          periodo_inicio: string | null
          referencia_transferencia: string | null
          seller_email: string | null
          seller_id: string | null
          seller_nombre: string | null
          subtotal: number | null
          total: number | null
        }
        Relationships: []
      }
      v_pitch_metrics: {
        Row: {
          crecimiento_mom_pct: number | null
          dau_mau_ratio_pct: number | null
          generado_en: string | null
          gmv_mes_usd: number | null
          gmv_total_historico_usd: number | null
          mascotas_con_historial_clinico: number | null
          mascotas_registradas: number | null
          nuevos_usuarios_mes: number | null
          prestadores_activos: number | null
          revenue_mes_usd: number | null
          sellers_activos: number | null
          ticket_promedio_usd: number | null
          usuarios_activos_mensuales: number | null
          usuarios_registrados_total: number | null
        }
        Relationships: []
      }
      v_prestadores_publicos: {
        Row: {
          acepta_emergencias: boolean | null
          acepta_telemedicina: boolean | null
          calificacion_promedio: number | null
          ciudad: string | null
          country_code: string | null
          descripcion: string | null
          foto_url: string | null
          id: string | null
          lat: number | null
          lon: number | null
          nombre_comercial: string | null
          radio_cobertura_km: number | null
          sector: string | null
          servicios: Json | null
          tipo: string | null
          total_citas: number | null
          total_resenas: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prestadores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestadores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_ranking_usuarios: {
        Row: {
          avatar_url: string | null
          nivel: string | null
          nivel_color: string | null
          nivel_icono: string | null
          nombre: string | null
          posicion_global: number | null
          posicion_mes: number | null
          puntos_mes: number | null
          puntos_totales: number | null
          racha_dias: number | null
          total_logros: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "puntos_usuario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puntos_usuario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_recurrentes_pendientes: {
        Row: {
          ciudad: string | null
          country_code: string | null
          direccion: string | null
          entrega_hora_fin: string | null
          entrega_hora_inicio: string | null
          frecuencia_dias: number | null
          id: string | null
          items: Json | null
          kushki_token: string | null
          max_pedidos: number | null
          pedidos_generados: number | null
          proximo_pedido: string | null
          ultimo_total: number | null
          user_id: string | null
          usuario_email: string | null
          usuario_nombre: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_recurrentes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_recurrentes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_resenas_todas: {
        Row: {
          autor_nombre: string | null
          calificacion: number | null
          comentario: string | null
          created_at: string | null
          entidad_id: string | null
          entidad_nombre: string | null
          es_visible: boolean | null
          id: string | null
          referencia_id: string | null
          tipo: string | null
          user_id: string | null
        }
        Relationships: []
      }
      v_revenue_plataforma_periodo: {
        Row: {
          country_code: string | null
          eventos_count: number | null
          gmv_total: number | null
          kushki_fees_total: number | null
          mes: string | null
          payout_total: number | null
          revenue_plataforma: number | null
          revenue_stream:
            | Database["public"]["Enums"]["revenue_stream_enum"]
            | null
          tipo_evento:
            | Database["public"]["Enums"]["tipo_evento_economico_enum"]
            | null
        }
        Relationships: []
      }
    }
    Functions: {
      _agenda_ocupacion: {
        Args: {
          p_duracion_minutos: number
          p_fecha: string
          p_hora: string
          p_prestador_id: string
        }
        Returns: number
      }
      _atencion_en_estados: {
        Args: { p_atencion_id: string; p_estados: string[] }
        Returns: Record<string, unknown>
      }
      _atencion_operable: {
        Args: { p_atencion_id: string }
        Returns: Record<string, unknown>
      }
      _crear_evento_padre_auto: {
        Args: {
          p_country_code: string
          p_creado_por_sistema: string
          p_creado_por_user_id: string
          p_datos: Json
          p_eje_jtbd: string
          p_empleado_id: string
          p_fecha_evento: string
          p_mascota_id: string
          p_prestador_id: string
          p_tipo: string
        }
        Returns: string
      }
      _debe_logear_atencion: {
        Args: { p_prestador_id: string; p_tipo_evento: string }
        Returns: boolean
      }
      _familia_tiene_miembros_vigentes: {
        Args: { p_familia_id: string }
        Returns: boolean
      }
      _grooming_atencion_terminada: {
        Args: { p_grooming_id: string }
        Returns: Record<string, unknown>
      }
      _notificar_dueño_prestador: {
        Args: {
          p_datos?: Json
          p_mensaje: string
          p_prestador_id: string
          p_tipo: string
          p_titulo: string
          p_url_accion: string
        }
        Returns: string
      }
      _tipo_documento_legible: { Args: { p_tipo: string }; Returns: string }
      _user_clinica_consultor_del_caso: {
        Args: { p_caso_id: string; p_user_id: string }
        Returns: boolean
      }
      _user_clinica_tratante_del_caso: {
        Args: { p_caso_id: string; p_user_id: string }
        Returns: boolean
      }
      _user_es_codueño_mascota: {
        Args: { p_mascota_id: string; p_user_id: string }
        Returns: boolean
      }
      _user_es_familiar_autorizado_mascota: {
        Args: { p_mascota_id: string; p_user_id: string }
        Returns: boolean
      }
      _user_es_miembro_familia: {
        Args: { p_familia_id: string; p_user_id: string }
        Returns: boolean
      }
      _user_es_titular_familia: {
        Args: { p_familia_id: string; p_user_id: string }
        Returns: boolean
      }
      _validar_ownership_cuenta_comercial: {
        Args: { p_cuenta_comercial_id: string }
        Returns: {
          estado: Database["public"]["Enums"]["estado_cuenta_comercial_enum"]
          mensaje: string
          valido: boolean
        }[]
      }
      aceptar_invitacion_pendiente_login: {
        Args: { p_empleado_id: string }
        Returns: Json
      }
      actualizar_datos_bancarios: {
        Args: {
          p_banco_codigo?: string
          p_banco_nombre?: string
          p_cuenta_comercial_id: string
          p_numero_cuenta?: string
          p_tipo_cuenta?: string
          p_titular_documento?: string
          p_titular_nombre?: string
          p_titular_tipo_documento?: string
        }
        Returns: {
          mensaje: string
          success: boolean
        }[]
      }
      actualizar_datos_fiscales_cuenta: {
        Args: {
          p_cuenta_comercial_id: string
          p_identificacion_fiscal: string
          p_razon_social: string
          p_tipo_fiscal: Database["public"]["Enums"]["tipo_fiscal_enum"]
        }
        Returns: {
          mensaje: string
          success: boolean
        }[]
      }
      agregar_incidencia_atencion: {
        Args: {
          p_atencion_id: string
          p_descripcion?: string
          p_incidencia_codigo: string
          p_severidad?: string
        }
        Returns: Json
      }
      agregar_mascota_a_familia: {
        Args: {
          p_especie: string
          p_fecha_nacimiento?: string
          p_foto_url?: string
          p_nombre_mascota: string
          p_precision_fecha?: string
          p_sexo?: string
        }
        Returns: Json
      }
      agregar_nota_atencion: {
        Args: {
          p_atencion_id: string
          p_categoria?: string
          p_texto: string
          p_via?: string
        }
        Returns: Json
      }
      agregar_novedad_paseo: {
        Args: {
          p_atencion_id: string
          p_detalle?: string
          p_novedad_codigo: string
        }
        Returns: Json
      }
      agregar_servicio_grooming: {
        Args: {
          p_grooming_id: string
          p_nota?: string
          p_servicio_codigo: string
        }
        Returns: Json
      }
      agregar_zona_grooming: {
        Args: { p_grooming_id: string; p_nota?: string; p_zona_codigo: string }
        Returns: Json
      }
      aplicar_reembolso: {
        Args: {
          p_aplicado_por?: string
          p_evento_original_id: string
          p_monto_parcial_bruto?: number
          p_motivo: string
        }
        Returns: string
      }
      buscar_cliente_por_email: { Args: { p_email: string }; Returns: Json }
      calcular_etapa_vida: {
        Args: { p_especie: string; p_fecha_nacimiento: string }
        Returns: string
      }
      cancelar_eventos_diferidos_pendientes: {
        Args: {
          p_aplicado_por?: string
          p_motivo: string
          p_parent_evento_id: string
        }
        Returns: {
          hijos_cancelados: number
          hijos_ya_liquidados: number
          monto_clawback_total: number
        }[]
      }
      cerrar_grooming_con_calidad: {
        Args: { p_grooming_id: string; p_mensaje_familia?: string }
        Returns: Json
      }
      cerrar_paseo_con_calidad: {
        Args: { p_atencion_id: string; p_mensaje_familia?: string }
        Returns: Json
      }
      cleanup_pendientes_vencidos: {
        Args: never
        Returns: {
          accion: string
          pendiente_id: string
        }[]
      }
      completar_cita_servicio: {
        Args: {
          p_cita_id: string
          p_empleado_id_actual?: string
          p_notas: string
        }
        Returns: Json
      }
      completar_historia_clinica: {
        Args: { input_data: Json }
        Returns: string
      }
      confirmar_cita_pagada: { Args: { p_cita_id: string }; Returns: Json }
      confirmar_cita_servicio: {
        Args: { p_cita_id: string; p_empleado_id_actual?: string }
        Returns: Json
      }
      crear_alta_asistida_existente: {
        Args: {
          p_country_code: string
          p_especie: string
          p_familia_id: string
          p_fecha_nacimiento?: string
          p_foto_url?: string
          p_microchip?: string
          p_nombre_mascota: string
          p_prestador_id: string
          p_raza?: string
          p_sexo?: string
          p_user_id_cliente: string
        }
        Returns: Json
      }
      crear_alta_asistida_pendiente: {
        Args: {
          p_country_code: string
          p_email: string
          p_especie: string
          p_fecha_nacimiento?: string
          p_foto_url?: string
          p_microchip?: string
          p_nombre_cliente: string
          p_nombre_mascota: string
          p_prestador_id: string
          p_raza?: string
          p_sexo?: string
          p_telefono: string
        }
        Returns: Json
      }
      crear_bloqueo_agenda: {
        Args: {
          p_fecha: string
          p_hora: string
          p_mascota_id: string
          p_prestador_id: string
          p_servicio_id: string
        }
        Returns: Json
      }
      crear_cuenta_comercial_inicial: {
        Args: {
          p_country_code: string
          p_identificacion_fiscal: string
          p_nombre_comercial: string
          p_razon_social: string
          p_tipo_fiscal: Database["public"]["Enums"]["tipo_fiscal_enum"]
        }
        Returns: {
          cuenta_comercial_id: string
          mensaje: string
          success: boolean
        }[]
      }
      crear_empleado_directo: {
        Args: { p_email: string; p_nombre: string; p_prestador_id: string }
        Returns: Json
      }
      crear_evento_economico: {
        Args: {
          p_categoria_origen?: string
          p_cohorte_periodo?: string
          p_country_code: string
          p_cuenta_comercial_id: string
          p_descuento_aplicado?: number
          p_fecha_cobro_kushki?: string
          p_fecha_devengo?: string
          p_kushki_charge_id?: string
          p_metadata?: Json
          p_moneda: string
          p_monto_bruto: number
          p_monto_kushki_fee: number
          p_origen_id: string
          p_origen_tipo: string
          p_parent_evento_id?: string
          p_quien_absorbe_descuento?: Database["public"]["Enums"]["quien_absorbe_descuento_enum"]
          p_revenue_stream: Database["public"]["Enums"]["revenue_stream_enum"]
          p_tipo_evento: Database["public"]["Enums"]["tipo_evento_economico_enum"]
        }
        Returns: string
      }
      crear_familia_con_primera_mascota: {
        Args: {
          p_especie: string
          p_fecha_nacimiento?: string
          p_foto_url?: string
          p_nombre_familia: string
          p_nombre_mascota: string
          p_precision_fecha?: string
          p_sexo?: string
        }
        Returns: Json
      }
      crear_mascota_walkin: {
        Args: {
          p_country_code?: string
          p_especie: string
          p_fecha_nacimiento?: string
          p_foto_url?: string
          p_microchip?: string
          p_nombre: string
          p_prestador_id: string
          p_raza?: string
          p_sexo?: string
        }
        Returns: string
      }
      crear_prestador_inicial: {
        Args: {
          p_acepta_emergencias?: boolean
          p_acepta_telemedicina?: boolean
          p_ciudad: string
          p_cuenta_comercial_id: string
          p_descripcion?: string
          p_direccion?: string
          p_email_contacto?: string
          p_lat?: number
          p_lon?: number
          p_matricula_profesional?: string
          p_metadata?: Json
          p_nombre_comercial: string
          p_radio_cobertura_km?: number
          p_sector?: string
          p_sitio_web?: string
          p_telefono?: string
          p_tipo: string
          p_whatsapp?: string
        }
        Returns: {
          mensaje: string
          prestador_id: string
          success: boolean
        }[]
      }
      debug_estado_user: {
        Args: { p_email: string }
        Returns: {
          detalle: string
          tabla: string
        }[]
      }
      debug_session: { Args: never; Returns: Json }
      desactivar_rasgo_identidad_personal: {
        Args: { p_evento_id: string; p_motivo: string }
        Returns: undefined
      }
      eje_de_tipo_servicio: {
        Args: { p_tipo_servicio: string }
        Returns: string
      }
      email_exists: { Args: { check_email: string }; Returns: boolean }
      email_status_para_invitacion: {
        Args: { p_email: string }
        Returns: string
      }
      encontrar_prestador_emergencia: {
        Args: {
          p_country?: string
          p_lat: number
          p_lon: number
          p_radio_km?: number
        }
        Returns: {
          distancia_km: number
          lat: number
          lon: number
          nombre: string
          prestador_id: string
          telefono: string
        }[]
      }
      escenario_d167_setup: { Args: never; Returns: Json }
      escenario_grooming_confirmado_persistente: { Args: never; Returns: Json }
      escenario_grooming_iniciado: { Args: never; Returns: Json }
      escenario_paseo_iniciado: { Args: never; Returns: Json }
      existe_invitacion_pendiente: {
        Args: { p_prestador_id: string }
        Returns: boolean
      }
      expirar_citas_pendientes: { Args: never; Returns: undefined }
      generar_eventos_diferidos: {
        Args: { p_fecha_corte?: string }
        Returns: {
          cohorte_periodo: string
          evento_hijo_id: string
          monto_devengado: number
          parent_evento_id: string
        }[]
      }
      generar_liquidacion: {
        Args: {
          p_aplicar_holdback_pct?: number
          p_country_code: string
          p_cuenta_comercial_id: string
          p_dias_holdback?: number
          p_generado_por?: string
          p_periodo_fin: string
          p_periodo_inicio: string
        }
        Returns: string
      }
      get_bancos_activos_por_pais: {
        Args: { p_country_code: string }
        Returns: {
          codigo: string
          nombre: string
          nombre_oficial: string
        }[]
      }
      get_country_config: {
        Args: { p_country_code?: string }
        Returns: {
          beta_only: boolean | null
          country_code: string
          country_name: string
          country_name_en: string
          created_at: string
          currency_code: string
          currency_decimals: number
          currency_symbol: string
          date_format: string
          default_language: string
          flag_emoji: string | null
          free_shipping_threshold: number | null
          id: string
          invoice_system: string | null
          is_active: boolean
          iva_pct: number
          launch_date: string | null
          payment_gateway: string
          payment_gateway_config: Json | null
          phone_prefix: string
          privacy_url: string | null
          requires_ruc: boolean | null
          services_enabled: Json
          shipping_providers: Json | null
          terms_url: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "country_config"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_estado_onboarding: {
        Args: never
        Returns: {
          cuenta_comercial_id: string
          cuenta_country_code: string
          cuenta_created_at: string
          cuenta_estado: Database["public"]["Enums"]["estado_cuenta_comercial_enum"]
          cuenta_identificacion: string
          cuenta_razon_social: string
          cuenta_tipo_fiscal: Database["public"]["Enums"]["tipo_fiscal_enum"]
          onboarding_completo: boolean
          prestador_created_at: string
          prestador_estado: string
          prestador_id: string
          prestador_nombre: string
          prestador_tipo: string
        }[]
      }
      get_estado_onboarding_dueno: { Args: never; Returns: Json }
      get_pais_detalle: {
        Args: { p_codigo_iso2: string }
        Returns: {
          activo: boolean
          codigo_iso2: string
          codigo_iso3: string
          formato_telefono: string
          mascara_id_fiscal: Json
          moneda_default: string
          nombre: string
          prefijo_telefono: string
          tipos_fiscales_soportados: string[]
        }[]
      }
      get_paises_activos: {
        Args: never
        Returns: {
          codigo_iso2: string
          codigo_iso3: string
          formato_telefono: string
          mascara_id_fiscal: Json
          moneda_default: string
          nombre: string
          prefijo_telefono: string
          tipos_fiscales_soportados: string[]
        }[]
      }
      get_paises_para_telefono: {
        Args: never
        Returns: {
          codigo_iso2: string
          formato_telefono: string
          nombre: string
          prefijo_telefono: string
        }[]
      }
      get_tipos_documento_titular_por_pais: {
        Args: { p_country_code: string }
        Returns: {
          codigo: string
          mascara_validacion: string
          nombre: string
        }[]
      }
      get_user_features: { Args: { p_user_id: string }; Returns: Json }
      iniciar_atencion_cita: { Args: { p_cita_id: string }; Returns: Json }
      iniciar_atencion_grooming: {
        Args: { p_cita_id: string; p_empleado_id?: string }
        Returns: Json
      }
      iniciar_atencion_paseo: {
        Args: { p_cita_id: string; p_empleado_id?: string }
        Returns: Json
      }
      insertar_documentos_batch: {
        Args: { p_archivos: Json; p_prestador_id: string }
        Returns: {
          documentos_insertados: number
          mensaje: string
          success: boolean
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      log_admin_action: {
        Args: {
          p_accion: string
          p_datos_antes?: Json
          p_datos_despues?: Json
          p_entidad_id?: string
          p_modulo: string
          p_user_email: string
          p_user_id: string
        }
        Returns: string
      }
      log_analytics_event: {
        Args: {
          p_country_code?: string
          p_event_name: string
          p_platform?: string
          p_properties?: Json
          p_user_id?: string
        }
        Returns: string
      }
      marcar_invitacion_aceptada: {
        Args: { p_invitacion_id: string }
        Returns: boolean
      }
      marcar_no_show_cita: { Args: { p_cita_id: string }; Returns: Json }
      mi_email: { Args: never; Returns: string }
      obtener_alertas_activas_mascota_para_familia_servicio: {
        Args: { p_familia_servicio: string; p_mascota_id: string }
        Returns: Json
      }
      obtener_cita_de_grooming: {
        Args: { p_grooming_id: string }
        Returns: Json
      }
      obtener_grooming_por_cita: { Args: { p_cita_id: string }; Returns: Json }
      obtener_mis_atenciones_grooming: {
        Args: { p_desde?: string; p_hasta?: string }
        Returns: Json
      }
      obtener_oferta_paseo: {
        Args: never
        Returns: {
          descripcion: string
          duracion_minutos: number
          especies_compatibles: Json
          precio: number
          prestador_id: string
          prestador_nombre: string
          prestador_servicio_id: string
          servicio_nombre: string
        }[]
      }
      obtener_paseadores_disponibles: {
        Args: { p_duracion_minutos: number; p_fecha: string; p_hora: string }
        Returns: {
          duracion_minutos: number
          precio: number
          prestador_id: string
          prestador_nombre: string
          prestador_servicio_id: string
          servicio_nombre: string
        }[]
      }
      obtener_paseo_por_cita: { Args: { p_cita_id: string }; Returns: Json }
      obtener_resumen_actividad_prestador: {
        Args: {
          p_desde: string
          p_hasta: string
          p_prestador_id: string
          p_rango: string
        }
        Returns: Json
      }
      obtener_resumen_cierre_grooming: {
        Args: { p_grooming_id: string }
        Returns: Json
      }
      obtener_resumen_cierre_paseo: {
        Args: { p_atencion_id: string }
        Returns: Json
      }
      obtener_resumen_dia_grooming: {
        Args: { p_fecha: string; p_prestador_id: string }
        Returns: Json
      }
      obtener_slots_disponibles: {
        Args: {
          p_desde: string
          p_hasta: string
          p_prestador_id: string
          p_servicio_id: string
        }
        Returns: {
          cupos_restantes: number
          duracion_minutos: number
          fecha: string
          hora: string
        }[]
      }
      obtener_ultima_atencion_grooming: {
        Args: { p_mascota_id: string }
        Returns: Json
      }
      otorgar_puntos: {
        Args: {
          p_descripcion: string
          p_logro_id?: string
          p_puntos: number
          p_referencia?: string
          p_tipo: string
          p_user_id: string
        }
        Returns: undefined
      }
      pausar_atencion: { Args: { p_atencion_id: string }; Returns: Json }
      quitar_estado_pelaje_grooming: {
        Args: { p_grooming_id: string; p_momento: string }
        Returns: Json
      }
      quitar_servicio_grooming: {
        Args: { p_grooming_id: string; p_servicio_codigo: string }
        Returns: Json
      }
      quitar_zona_grooming: {
        Args: { p_grooming_id: string; p_zona_codigo: string }
        Returns: Json
      }
      reanudar_atencion: { Args: { p_atencion_id: string }; Returns: Json }
      rechazar_cita_servicio: {
        Args: { p_cita_id: string; p_motivo: string }
        Returns: Json
      }
      rechazar_invitacion_pendiente_login: {
        Args: { p_empleado_id: string }
        Returns: Json
      }
      registrar_archivo_atencion: {
        Args: {
          p_atencion_id: string
          p_bucket: string
          p_categoria?: string
          p_descripcion?: string
          p_mime_type?: string
          p_nombre_archivo?: string
          p_storage_path: string
          p_tamano_bytes?: number
        }
        Returns: Json
      }
      registrar_archivo_grooming: {
        Args: {
          p_descripcion?: string
          p_grooming_id: string
          p_storage_path: string
          p_tipo: string
        }
        Returns: Json
      }
      registrar_estado_pelaje_en_cierre: {
        Args: {
          p_estado_codigo: string
          p_grooming_id: string
          p_momento: string
          p_nota?: string
        }
        Returns: Json
      }
      registrar_estado_pelaje_grooming: {
        Args: {
          p_estado_codigo: string
          p_grooming_id: string
          p_momento: string
          p_nota?: string
        }
        Returns: Json
      }
      registrar_producto_grooming: {
        Args: {
          p_cantidad?: number
          p_grooming_id: string
          p_nota?: string
          p_producto_codigo?: string
          p_producto_otro?: string
          p_unidad?: string
        }
        Returns: Json
      }
      registrar_rasgo_identidad_personal: {
        Args: {
          p_descripcion?: string
          p_familia_miembro_id?: string
          p_mascota_id: string
          p_relevante_para?: string[]
          p_subtipo: string
          p_titulo_corto: string
        }
        Returns: string
      }
      registrar_track_paseo: {
        Args: { p_append?: boolean; p_atencion_id: string; p_puntos: Json }
        Returns: Json
      }
      registrar_vacunas_de_carnet: {
        Args: { p_archivo_url?: string; p_mascota_id: string; p_vacunas: Json }
        Returns: Json
      }
      resolver_fee_aplicable: {
        Args: {
          p_categoria_origen?: string
          p_country_code: string
          p_cuenta_comercial_id: string
          p_fecha_referencia?: string
          p_revenue_stream: Database["public"]["Enums"]["revenue_stream_enum"]
          p_tipo_actor: Database["public"]["Enums"]["tipo_actor_enum"]
          p_tipo_origen: string
        }
        Returns: {
          absorbe_descuento_default: Database["public"]["Enums"]["quien_absorbe_descuento_enum"]
          es_default: boolean
          fee_config_id: string
          parametros: Json
          tipo_calculo: Database["public"]["Enums"]["tipo_calculo_fee_enum"]
        }[]
      }
      service_active_in: {
        Args: { p_country_code?: string; p_service: string }
        Returns: boolean
      }
      simular_cliente_agenda_cita: {
        Args: {
          p_estado?: string
          p_fecha_hora: string
          p_mascota_id: string
          p_modalidad?: string
          p_prestador_id: string
          p_session_id?: string
          p_tipo_servicio: string
          p_user_id: string
        }
        Returns: Json
      }
      simular_cliente_crea_familia: {
        Args: {
          p_nombre_familia: string
          p_session_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      simular_cliente_crea_mascota: {
        Args: {
          p_especie?: string
          p_familia_id: string
          p_nombre: string
          p_origen?: string
          p_session_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      simular_cliente_otorga_acceso_prestador: {
        Args: {
          p_cuenta_comercial_id: string
          p_mascota_id: string
          p_metodo?: string
          p_session_id?: string
          p_user_id_otorgante: string
        }
        Returns: Json
      }
      simular_prestador_inicia_grooming: {
        Args: {
          p_cita_id: string
          p_empleado_id?: string
          p_session_id?: string
        }
        Returns: Json
      }
      simular_prestador_inicia_paseo: {
        Args: {
          p_cita_id: string
          p_empleado_id?: string
          p_session_id?: string
        }
        Returns: Json
      }
      terminar_atencion_grooming: {
        Args: { p_grooming_id: string }
        Returns: Json
      }
      terminar_atencion_paseo: {
        Args: { p_atencion_id: string; p_gps_motivo_fallo?: string }
        Returns: Json
      }
      test_cleanup_all: { Args: never; Returns: Json }
      test_funcion_dummy: { Args: never; Returns: string }
      test_guard_activo: { Args: never; Returns: boolean }
      test_marca_metadata: {
        Args: { p_funcion_origen: string; p_session_id: string }
        Returns: Json
      }
      test_marca_nombre: {
        Args: { p_nombre: string; p_session_id: string }
        Returns: string
      }
      test_registry_insert: {
        Args: {
          p_fila_id: string
          p_funcion_origen: string
          p_metadata?: Json
          p_session_id: string
          p_tabla: string
        }
        Returns: string
      }
      test_sb1_transversales_genericas: { Args: never; Returns: Json }
      use_beta_invite: {
        Args: { p_beta_id: string; p_user_id: string }
        Returns: undefined
      }
      user_has_feature: {
        Args: { p_feature: string; p_user_id: string }
        Returns: boolean
      }
      user_puede_acceder_prestador: {
        Args: { p_prestador_id: string }
        Returns: boolean
      }
      user_puede_ver_dimension: {
        Args: { p_dimension: string; p_mascota_id: string }
        Returns: boolean
      }
      user_tiene_acceso_a_mascota: {
        Args: { p_mascota_id: string }
        Returns: boolean
      }
      validar_identificacion_fiscal: {
        Args: {
          p_country_code: string
          p_identificacion: string
          p_tipo_fiscal: Database["public"]["Enums"]["tipo_fiscal_enum"]
        }
        Returns: {
          mensaje: string
          valido: boolean
        }[]
      }
      validate_beta_access: {
        Args: { p_email?: string; p_invite_code?: string }
        Returns: Json
      }
      verificar_identificacion_disponible: {
        Args: { p_country_code: string; p_identificacion: string }
        Returns: {
          disponible: boolean
          mensaje: string
        }[]
      }
      wizard_crear_cuenta_y_rol: {
        Args: {
          p_acepta_emergencias?: boolean
          p_acepta_telemedicina?: boolean
          p_ciudad: string
          p_country_code: string
          p_descripcion?: string
          p_direccion?: string
          p_email_contacto?: string
          p_identificacion_fiscal: string
          p_lat?: number
          p_lon?: number
          p_matricula_profesional?: string
          p_metadata?: Json
          p_nombre_comercial_cuenta: string
          p_nombre_comercial_prestador: string
          p_radio_cobertura_km?: number
          p_razon_social: string
          p_sector?: string
          p_sitio_web?: string
          p_telefono?: string
          p_tipo_fiscal: Database["public"]["Enums"]["tipo_fiscal_enum"]
          p_tipo_prestador: string
          p_whatsapp?: string
        }
        Returns: {
          cuenta_comercial_id: string
          mensaje: string
          prestador_id: string
          success: boolean
        }[]
      }
    }
    Enums: {
      estado_cuenta_comercial_enum:
        | "pendiente_validacion"
        | "activa"
        | "suspendida"
        | "cerrada"
      estado_cuenta_rol_enum: "activo" | "suspendido" | "cerrado"
      estado_evento_economico_enum:
        | "pendiente_liquidar"
        | "liquidado"
        | "reversado"
        | "en_disputa"
        | "no_aplica"
      estado_liquidacion_enum:
        | "borrador"
        | "calculado"
        | "aprobado"
        | "pagado"
        | "en_disputa"
        | "anulada"
      modelo_comercial_enum: "marketplace_fachada" | "reventa_pura" | "mixto"
      quien_absorbe_descuento_enum: "plataforma" | "seller" | "compartido"
      revenue_stream_enum:
        | "transaccional"
        | "recurrente"
        | "eventual"
        | "publicitario"
        | "passthrough"
      tipo_actor_enum:
        | "seller_productos"
        | "prestador_servicios"
        | "refugio"
        | "criadero"
        | "aseguradora"
        | "plataforma_directa"
        | "otro"
      tipo_calculo_fee_enum:
        | "porcentual"
        | "fijo"
        | "escalonado"
        | "passthrough_kushki"
        | "personalizado"
      tipo_evento_economico_enum:
        | "pedido_pagado"
        | "cita_pagada"
        | "donacion_recibida"
        | "pago_suscripcion"
        | "pago_publicacion"
        | "pago_boost"
        | "pago_publicidad"
        | "pago_prima_seguro"
        | "devengo_diferido"
        | "venta_directa_plataforma"
        | "reembolso"
        | "ajuste_manual"
        | "penalidad_cancelacion"
      tipo_fiscal_enum:
        | "persona_natural"
        | "persona_natural_obligada"
        | "persona_juridica"
        | "entidad_sin_fines_lucro"
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
      estado_cuenta_comercial_enum: [
        "pendiente_validacion",
        "activa",
        "suspendida",
        "cerrada",
      ],
      estado_cuenta_rol_enum: ["activo", "suspendido", "cerrado"],
      estado_evento_economico_enum: [
        "pendiente_liquidar",
        "liquidado",
        "reversado",
        "en_disputa",
        "no_aplica",
      ],
      estado_liquidacion_enum: [
        "borrador",
        "calculado",
        "aprobado",
        "pagado",
        "en_disputa",
        "anulada",
      ],
      modelo_comercial_enum: ["marketplace_fachada", "reventa_pura", "mixto"],
      quien_absorbe_descuento_enum: ["plataforma", "seller", "compartido"],
      revenue_stream_enum: [
        "transaccional",
        "recurrente",
        "eventual",
        "publicitario",
        "passthrough",
      ],
      tipo_actor_enum: [
        "seller_productos",
        "prestador_servicios",
        "refugio",
        "criadero",
        "aseguradora",
        "plataforma_directa",
        "otro",
      ],
      tipo_calculo_fee_enum: [
        "porcentual",
        "fijo",
        "escalonado",
        "passthrough_kushki",
        "personalizado",
      ],
      tipo_evento_economico_enum: [
        "pedido_pagado",
        "cita_pagada",
        "donacion_recibida",
        "pago_suscripcion",
        "pago_publicacion",
        "pago_boost",
        "pago_publicidad",
        "pago_prima_seguro",
        "devengo_diferido",
        "venta_directa_plataforma",
        "reembolso",
        "ajuste_manual",
        "penalidad_cancelacion",
      ],
      tipo_fiscal_enum: [
        "persona_natural",
        "persona_natural_obligada",
        "persona_juridica",
        "entidad_sin_fines_lucro",
      ],
    },
  },
} as const
