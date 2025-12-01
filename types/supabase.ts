export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string
          email: string | null
          nombre_completo: string | null
          rol: "admin" | "ventas" | "tecnico"
          activo: boolean
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          nombre_completo?: string | null
          rol: "admin" | "ventas" | "tecnico"
          activo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          nombre_completo?: string | null
          rol?: "admin" | "ventas" | "tecnico"
          activo?: boolean
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          cliente_nombre: string
          cliente_contacto: string | null
          dispositivo_modelo: string | null
          falla_declarada: string | null
          prioridad: "baja" | "normal" | "alta" | "urgente"
          estado: "abierto" | "asignado" | "en_proceso" | "espera_repuesto" | "finalizado" | "entregado"
          creado_por: string | null
          asignado_a: string | null
          foto_url: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          cliente_nombre: string
          cliente_contacto?: string | null
          dispositivo_modelo?: string | null
          falla_declarada?: string | null
          prioridad?: "baja" | "normal" | "alta" | "urgente"
          estado?: "abierto" | "asignado" | "en_proceso" | "espera_repuesto" | "finalizado" | "entregado"
          creado_por?: string | null
          asignado_a?: string | null
          foto_url?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          cliente_nombre?: string
          cliente_contacto?: string | null
          dispositivo_modelo?: string | null
          falla_declarada?: string | null
          prioridad?: "baja" | "normal" | "alta" | "urgente"
          estado?: "abierto" | "asignado" | "en_proceso" | "espera_repuesto" | "finalizado" | "entregado"
          creado_por?: string | null
          asignado_a?: string | null
          foto_url?: string | null
        }
      }
      reportes: {
        Row: {
          id: number
          ticket_id: number | null
          tecnico_id: string | null
          notas_brutas: string | null
          reporte_ia: string | null
          repuestos_lista: string | null
          costo_reparacion: number | null
          created_at: string
        }
        Insert: {
          id?: number
          ticket_id?: number | null
          tecnico_id?: string | null
          notas_brutas?: string | null
          reporte_ia?: string | null
          repuestos_lista?: string | null
          costo_reparacion?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          ticket_id?: number | null
          tecnico_id?: string | null
          notas_brutas?: string | null
          reporte_ia?: string | null
          repuestos_lista?: string | null
          costo_reparacion?: number | null
          created_at?: string
        }
      }
    }
  }
}

















