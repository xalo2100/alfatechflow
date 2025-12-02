"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAppConfig } from "@/lib/app-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, FileText, Eye, X, Pen, Mail, Save, MessageCircle } from "lucide-react";
import { FirmaClienteDialog } from "@/components/reportes/firma-cliente-dialog";
import { FirmaTecnicoDialog } from "@/components/reportes/firma-tecnico-dialog";
import { BuscarClientePipedrive } from "@/components/pipedrive/buscar-cliente";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReporteAlfapackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: number;
  tecnicoId: string;
  ticketData: {
    cliente_nombre: string;
    cliente_contacto?: string;
    dispositivo_modelo?: string;
    falla_declarada?: string;
    datos_cliente?: any; // Datos completos de Pipedrive guardados en el ticket
  };
  onSuccess: () => void;
}

interface Equipo {
  maquina: string;
  modelo: string;
  numero_serie: string;
  ano: string;
}

export function ReporteAlfapackDialog({
  open,
  onOpenChange,
  ticketId,
  tecnicoId,
  ticketData,
  onSuccess,
}: ReporteAlfapackDialogProps) {
  const [notasBrutas, setNotasBrutas] = useState("");
  const [generando, setGenerando] = useState(false);
  const [reporteGenerado, setReporteGenerado] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [reporteGuardadoId, setReporteGuardadoId] = useState<number | null>(null);
  const [mostrarFirmaDialog, setMostrarFirmaDialog] = useState(false);
  const [firmaCliente, setFirmaCliente] = useState<{ imagen: string; nombre: string; fecha: string } | null>(null);
  const [mostrarFirmaTecnicoDialog, setMostrarFirmaTecnicoDialog] = useState(false);
  const [firmaTecnico, setFirmaTecnico] = useState<{ imagen: string; nombre: string; fecha: string } | null>(null);
  const [tecnicoNombre, setTecnicoNombre] = useState<string>("");
  
  // Obtener nombre del técnico
  useEffect(() => {
    const obtenerNombreTecnico = async () => {
      if (tecnicoId) {
        const { data } = await supabase
          .from("perfiles")
          .select("nombre_completo")
          .eq("id", tecnicoId)
          .single();
        if (data?.nombre_completo) {
          setTecnicoNombre(data.nombre_completo);
        }
      }
    };
    if (open && tecnicoId) {
      obtenerNombreTecnico();
    }
  }, [open, tecnicoId]);
  
  useEffect(() => {
    // Cargar configuración al montar el componente
    const config = getAppConfig();
    setAppConfig(config);
    console.log("📋 App config cargada:", { nombre: config.nombre, tieneLogo: !!config.logo });
  }, []);

  // Actualizar appConfig cuando se abre la vista previa o el diálogo
  useEffect(() => {
    if (open || mostrarVistaPrevia) {
      const config = getAppConfig();
      setAppConfig(config);
      console.log("🔄 App config actualizada:", { nombre: config.nombre, tieneLogo: !!config.logo, logo: config.logo?.substring(0, 50) });
    }
  }, [open, mostrarVistaPrevia]);

  // Actualizar appConfig cuando se abre la vista previa
  useEffect(() => {
    if (mostrarVistaPrevia) {
      setAppConfig(getAppConfig());
    }
  }, [mostrarVistaPrevia]);
  
  // Función para separar empresa y contacto si vienen combinados
  const separarEmpresaYContacto = (clienteNombre: string) => {
    if (!clienteNombre) return { empresa: "", contacto: "" };
    
    // Si viene en formato "EMPRESA - CONTACTO"
    const partes = clienteNombre.split(" - ");
    if (partes.length >= 2) {
      return {
        empresa: partes[0].trim(),
        contacto: partes.slice(1).join(" - ").trim(), // Por si hay más de un " - "
      };
    }
    
    // Si no tiene el formato, asumir que es solo la empresa
    return { empresa: clienteNombre.trim(), contacto: "" };
  };

  // Actualizar formData cuando se abre el diálogo o cambian los datos del ticket
  useEffect(() => {
    if (open) {
      const datosCliente = ticketData.datos_cliente || null;
      const { empresa: empresaInicial, contacto: contactoInicial } = separarEmpresaYContacto(
        ticketData.cliente_nombre || ""
      );

      console.log(`[REPORTE] ==========================================`);
      console.log(`[REPORTE] 🔄 ACTUALIZANDO FORMULARIO CON DATOS DEL TICKET`);
      console.log(`[REPORTE] Ticket ID: ${ticketId}`);
      console.log(`[REPORTE] Cliente nombre: ${ticketData.cliente_nombre}`);
      console.log(`[REPORTE] Datos cliente (Pipedrive):`, datosCliente);
      console.log(`[REPORTE] Empresa inicial (separada): ${empresaInicial}`);
      console.log(`[REPORTE] Contacto inicial (separado): ${contactoInicial}`);
      console.log(`[REPORTE] ==========================================`);

      // Si hay datos de Pipedrive, usarlos; sino usar datos básicos separados
      const razonSocial = datosCliente?.razon_social || empresaInicial || "";
      const rut = datosCliente?.rut || "";
      const direccion = datosCliente?.direccion || "";
      const responsable = datosCliente?.responsable || contactoInicial || "";
      const emailCliente = datosCliente?.email_cliente || ticketData.cliente_contacto || "";
      const ciudad = datosCliente?.ciudad || "";
      const telefonoFijo = datosCliente?.telefono_fijo || "";
      const celular = datosCliente?.celular || "";

      console.log(`[REPORTE] ✅ Valores que se asignarán:`, {
        razon_social: razonSocial,
        rut,
        direccion,
        responsable,
        email_cliente: emailCliente,
        ciudad,
        telefono_fijo: telefonoFijo,
        celular,
      });

      setFormData((prev) => ({
        ...prev,
        // Cliente - prellenar con datos de Pipedrive del ticket si existen, sino usar datos básicos
        razon_social: razonSocial,
        rut: rut,
        direccion: direccion,
        responsable: responsable,
        email_cliente: emailCliente,
        ciudad: ciudad,
        telefono_fijo: telefonoFijo,
        celular: celular,
      }));
    }
  }, [open, ticketId, ticketData.datos_cliente, ticketData.cliente_nombre, ticketData.cliente_contacto]);

  // Separar empresa y contacto del ticket (fallback si no hay datos_cliente)
  const { empresa: empresaInicial, contacto: contactoInicial } = separarEmpresaYContacto(
    ticketData.cliente_nombre || ""
  );

  // Cargar datos completos de Pipedrive desde el ticket si existen
  const datosClienteTicket = ticketData.datos_cliente || null;
  console.log(`[REPORTE] 📋 Datos del cliente desde ticket:`, datosClienteTicket);

  // Campos del formulario Alfapack - inicializar con datos del ticket
  const [formData, setFormData] = useState({
    // Cliente - prellenar con datos de Pipedrive del ticket si existen, sino usar datos básicos
    razon_social: datosClienteTicket?.razon_social || empresaInicial || "",
    rut: datosClienteTicket?.rut || "",
    direccion: datosClienteTicket?.direccion || "",
    responsable: datosClienteTicket?.responsable || contactoInicial || "",
    email_cliente: datosClienteTicket?.email_cliente || ticketData.cliente_contacto || "",
    fecha: new Date().toISOString().split('T')[0],
    planta: "",
    ciudad: datosClienteTicket?.ciudad || "",
    telefono_fijo: datosClienteTicket?.telefono_fijo || "",
    celular: datosClienteTicket?.celular || "",
    facturable: true,
    // Equipo - prellenar con datos del ticket
    equipos: ticketData.dispositivo_modelo ? [{ 
      maquina: ticketData.dispositivo_modelo, 
      modelo: "", 
      numero_serie: "", 
      ano: "" 
    }] : [{ maquina: "", modelo: "", numero_serie: "", ano: "" }] as Equipo[],
    // Tipo de servicio (checkbox)
    tipo_servicio: [] as string[],
    // Diagnóstico, Trabajo, Observación
    diagnostico: "",
    trabajo_realizado: "",
    observacion: "",
    // Repuestos
    repuestos: [] as Array<{ codigo: string; cantidad: string; descripcion: string; garantia: boolean }>,
    // Tiempos
    hora_entrada: "",
    hora_salida: "",
    horas_espera: "",
    horas_trabajo: "",
    tiempo_ida: "",
    tiempo_regreso: "",
  });

  const supabase = createClient();

  // Función para calcular horas de trabajo automáticamente
  const calcularHorasTrabajo = (horaEntrada: string, horaSalida: string, horasEspera: string): string => {
    // Si no hay hora de entrada o salida, no calcular
    if (!horaEntrada || !horaSalida) {
      return "";
    }

    try {
      // Convertir horas de entrada y salida a minutos desde medianoche
      const [entradaH, entradaM] = horaEntrada.split(":").map(Number);
      const [salidaH, salidaM] = horaSalida.split(":").map(Number);

      const entradaMinutos = entradaH * 60 + entradaM;
      const salidaMinutos = salidaH * 60 + salidaM;

      // Calcular diferencia en minutos
      let diferenciaMinutos = salidaMinutos - entradaMinutos;

      // Si la salida es menor que la entrada, asumir que pasó medianoche
      if (diferenciaMinutos < 0) {
        diferenciaMinutos += 24 * 60; // Agregar 24 horas
      }

      // Convertir a horas (decimal)
      let horasTrabajo = diferenciaMinutos / 60;

      // Restar horas de espera si existen
      const horasEsperaNum = parseFloat(horasEspera) || 0;
      horasTrabajo = horasTrabajo - horasEsperaNum;

      // Asegurar que no sea negativo
      if (horasTrabajo < 0) {
        horasTrabajo = 0;
      }

      // Redondear a 1 decimal
      return horasTrabajo.toFixed(1);
    } catch (error) {
      console.error("Error calculando horas de trabajo:", error);
      return "";
    }
  };

  // Calcular horas de trabajo automáticamente cuando cambian los campos
  useEffect(() => {
    if (formData.hora_entrada && formData.hora_salida) {
      const horasCalculadas = calcularHorasTrabajo(
        formData.hora_entrada,
        formData.hora_salida,
        formData.horas_espera
      );
      
      // Solo actualizar si el valor calculado es diferente al actual
      if (horasCalculadas && horasCalculadas !== formData.horas_trabajo) {
        setFormData((prev) => ({
          ...prev,
          horas_trabajo: horasCalculadas,
        }));
      } else if (!horasCalculadas && formData.horas_trabajo) {
        // Si no se puede calcular (campos vacíos), limpiar el campo
        setFormData((prev) => ({
          ...prev,
          horas_trabajo: "",
        }));
      }
    } else if (formData.horas_trabajo) {
      // Si falta hora entrada o salida, limpiar horas trabajo
      setFormData((prev) => ({
        ...prev,
        horas_trabajo: "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.hora_entrada, formData.hora_salida, formData.horas_espera]);

  const generarConIA = async () => {
    if (!notasBrutas.trim()) {
      alert("Por favor, escribe las notas del trabajo realizado");
      return;
    }

    setGenerando(true);
    try {
      const response = await fetch("/api/gemini/generar-reporte-alfapack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notas: notasBrutas }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || (!data.diagnostico && !data.trabajo_realizado)) {
        throw new Error("La respuesta de la IA no contiene datos válidos");
      }
      
      setReporteGenerado(data);
      
      // Llenar automáticamente los campos
      setFormData(prev => ({
        ...prev,
        diagnostico: data.diagnostico || "",
        trabajo_realizado: data.trabajo_realizado || "",
        observacion: data.observacion || "",
      }));
    } catch (error: any) {
      console.error("Error generando reporte:", error);
      alert("Error al generar el reporte: " + error.message);
    } finally {
      setGenerando(false);
    }
  };

  const agregarRepuesto = () => {
    setFormData(prev => ({
      ...prev,
      repuestos: [...prev.repuestos, { codigo: "", cantidad: "", descripcion: "", garantia: false }],
    }));
  };

  const actualizarRepuesto = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      repuestos: prev.repuestos.map((rep, i) =>
        i === index ? { ...rep, [field]: value } : rep
      ),
    }));
  };

  // Función para enviar email del reporte
  const enviarEmailReporte = async (reporteId: number): Promise<string> => {
    const emailDestino = formData.email_cliente || ticketData.cliente_contacto;
    
    if (!emailDestino) {
      return "\n\n⚠️ No se pudo enviar el email porque no hay dirección de correo configurada para el cliente.";
    }

    try {
      console.log("📧 Enviando reporte por email a:", emailDestino);
      // Esperar un momento para asegurar que el reporte esté disponible en la BD
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const emailResponse = await fetch("/api/reportes/enviar-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporteId: reporteId,
          emailDestino: emailDestino,
        }),
      });

      if (emailResponse.ok) {
        return `\n\n📧 Email enviado exitosamente a: ${emailDestino}`;
      } else {
        const errorData = await emailResponse.json();
        console.warn("Error enviando email:", errorData);
        const errorMsg = errorData.error || "Error desconocido";
        
        // Mensaje más claro según el tipo de error
        if (errorMsg.includes("No hay configuración de email") || errorMsg.includes("RESEND_API_KEY") || errorMsg.includes("SMTP")) {
          return `\n\n⚠️ NO se pudo enviar el email a ${emailDestino}.\n\nRazón: La configuración de email no está completa.\n\nPara habilitar el envío de emails, configura RESEND_API_KEY o SMTP en las variables de entorno.`;
        } else if (errorMsg.includes("domain is not verified") || errorMsg.includes("dominio no está verificado")) {
          return `\n\n⚠️ NO se pudo enviar el email a: ${emailDestino}\n\nError: El dominio alfapack.cl no está verificado en Resend.\n\nSolución: Verifica el dominio en https://resend.com/domains o el sistema usará automáticamente el dominio de prueba de Resend.`;
        } else {
          return `\n\n⚠️ NO se pudo enviar el email a: ${emailDestino}\n\nError: ${errorMsg}`;
        }
      }
    } catch (emailError: any) {
      console.error("Error enviando email:", emailError);
      return `\n\n⚠️ Hubo un error al intentar enviar el email a ${emailDestino}.\n\nError: ${emailError.message || "Error desconocido"}`;
    }
  };

  // Función para guardar el reporte (sin enviar email)
  const guardarReporte = async (enviarEmail: boolean = false) => {
    if (!formData.diagnostico || !formData.trabajo_realizado) {
      alert("Por favor completa Diagnóstico y Trabajo Realizado");
      return;
    }

    setGuardando(true);
    try {
      const reporteCompleto = {
        // Cliente
        razon_social: formData.razon_social || ticketData.cliente_nombre,
        rut: formData.rut,
        direccion: formData.direccion,
        responsable: formData.responsable,
        email_cliente: formData.email_cliente || ticketData.cliente_contacto,
        fecha: formData.fecha,
        planta: formData.planta,
        ciudad: formData.ciudad,
        telefono_fijo: formData.telefono_fijo,
        celular: formData.celular,
        facturable: formData.facturable,
        // Equipo
        equipos: formData.equipos,
        // Tipo de servicio
        tipo_servicio: formData.tipo_servicio,
        // Diagnóstico, Trabajo, Observación
        diagnostico: formData.diagnostico,
        trabajo_realizado: formData.trabajo_realizado,
        observacion: formData.observacion,
        // Repuestos
        repuestos: formData.repuestos,
        // Tiempos
        hora_entrada: formData.hora_entrada,
        hora_salida: formData.hora_salida,
        horas_espera: formData.horas_espera,
        horas_trabajo: formData.horas_trabajo,
        tiempo_ida: formData.tiempo_ida,
        tiempo_regreso: formData.tiempo_regreso,
        // Firma del cliente (si existe)
        firma_cliente: firmaCliente || null,
        // Firma del técnico (si existe)
        firma_tecnico: firmaTecnico || null,
      };

      const { data: reporteInsertado, error } = await supabase.from("reportes").insert({
        ticket_id: ticketId,
        tecnico_id: tecnicoId,
        notas_brutas: notasBrutas,
        reporte_ia: JSON.stringify(reporteCompleto),
        repuestos_lista: formData.repuestos.map(r => `${r.cantidad}x ${r.descripcion}${r.codigo ? ` (${r.codigo})` : ""}`).join(", "),
        costo_reparacion: null,
      }).select().single();

      if (error) throw error;

      // Guardar el ID del reporte para poder firmarlo después
      setReporteGuardadoId(reporteInsertado.id);

      // Actualizar ticket a finalizado SOLO cuando se guarda el reporte
      await supabase
        .from("tickets")
        .update({ estado: "finalizado" })
        .eq("id", ticketId);

      // Enviar email solo si se solicita
      let mensajeEmail = "";
      if (enviarEmail) {
        mensajeEmail = await enviarEmailReporte(reporteInsertado.id);
      }

      // Mostrar mensaje de confirmación
      const mensajeCompleto = `✅ Reporte guardado exitosamente.${mensajeEmail}`;
      
      // Si solo se está guardando (sin enviar email), preguntar si quiere agregar firma
      if (!enviarEmail) {
        if (!firmaCliente) {
          const quiereFirmar = window.confirm(
            `${mensajeCompleto}\n\n¿Deseas obtener la firma del cliente ahora?`
          );

          if (quiereFirmar && reporteInsertado.id) {
            setMostrarFirmaDialog(true);
            return; // No cerrar el diálogo aún
          }
        } else {
          // Si ya hay firma, solo mostrar el mensaje de confirmación
          alert(mensajeCompleto);
        }
        
        // Si guardó sin enviar, cerrar y resetear
        onSuccess();
        // Reset
        setNotasBrutas("");
        setFormData({
          razon_social: "",
          rut: "",
          direccion: "",
          responsable: "",
          email_cliente: "",
          fecha: new Date().toISOString().split('T')[0],
          planta: "",
          ciudad: "",
          telefono_fijo: "",
          celular: "",
          facturable: true,
          equipos: [{ maquina: "", modelo: "", numero_serie: "", ano: "" }],
          tipo_servicio: [],
          diagnostico: "",
          trabajo_realizado: "",
          observacion: "",
          repuestos: [],
          hora_entrada: "",
          hora_salida: "",
          horas_espera: "",
          horas_trabajo: "",
          tiempo_ida: "",
          tiempo_regreso: "",
        });
        setReporteGenerado(null);
      } else {
        // Si se envió el email, solo mostrar mensaje pero NO cerrar el diálogo
        // El usuario puede seguir editando o guardar de nuevo
        alert(mensajeCompleto);
        // NO llamar a onSuccess() ni resetear el formulario
        // El diálogo permanece abierto para que el usuario pueda seguir trabajando
      }
    } catch (error: any) {
      console.error("Error guardando reporte:", error);
      alert("Error al guardar el reporte: " + error.message);
    } finally {
      setGuardando(false);
    }
  };

  // Función para guardar y enviar email
  const guardarYEnviarReporte = async () => {
    await guardarReporte(true);
  };

  // Función para enviar reporte por WhatsApp (solo después de guardar)
  const enviarPorWhatsApp = async () => {
    if (!reporteGuardadoId) {
      alert("⚠️ Primero debes guardar el reporte antes de enviarlo por WhatsApp.");
      return;
    }

    try {
      // Obtener datos del reporte guardado
      const { data: reporte, error } = await supabase
        .from("reportes")
        .select(`
          *,
          ticket:tickets(*)
        `)
        .eq("id", reporteGuardadoId)
        .single();

      if (error || !reporte) {
        throw new Error("No se pudo obtener el reporte guardado");
      }

      // Obtener número de celular del cliente
      let reporteData: any = {};
      try {
        reporteData = JSON.parse(reporte.reporte_ia as string);
      } catch {
        reporteData = {};
      }

      const celular = reporteData.celular || 
                     formData.celular || 
                     (reporte.ticket as any)?.datos_cliente?.celular || 
                     "";

      if (!celular || celular.trim() === "") {
        alert("⚠️ No se encontró número de celular del cliente. Por favor, agrega el número en los datos del cliente.");
        return;
      }

      // Limpiar número (quitar espacios, guiones, paréntesis)
      const numeroLimpio = celular.replace(/[\s\-\(\)]/g, "");
      // Asegurar que empiece con código de país (Chile: +56)
      const numeroFormateado = numeroLimpio.startsWith("56") 
        ? `+${numeroLimpio}` 
        : numeroLimpio.startsWith("+56")
        ? numeroLimpio
        : `+56${numeroLimpio}`;

      // Mensaje para WhatsApp
      const clienteNombre = reporteData.razon_social || formData.razon_social || (reporte.ticket as any)?.cliente_nombre || "Cliente";
      const mensaje = `Hola! Te envío el Reporte Técnico N° ${ticketId} de ${clienteNombre}.\n\nPor favor, revisa el documento adjunto.`;
      
      // Crear enlace de WhatsApp
      const mensajeCodificado = encodeURIComponent(mensaje);
      const whatsappUrl = `https://wa.me/${numeroFormateado.replace(/\+/g, "")}?text=${mensajeCodificado}`;
      
      // Abrir WhatsApp
      window.open(whatsappUrl, "_blank");
      
      // Descargar el PDF automáticamente
      // Nota: Necesitarás implementar la función descargarReportePDF
      alert("✅ WhatsApp abierto. Por favor, descarga el PDF del reporte y adjúntalo en la conversación de WhatsApp.");

    } catch (error: any) {
      console.error('Error enviando por WhatsApp:', error);
      alert('Error al preparar el envío por WhatsApp: ' + (error.message || 'Error desconocido'));
    }
  };

  return (
    <>
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // Si se está cerrando y hay datos sin guardar, preguntar confirmación
        if (!newOpen && open) {
          const tieneDatos = formData.razon_social || formData.diagnostico || formData.trabajo_realizado || notasBrutas;
          if (tieneDatos && !reporteGenerado) {
            const confirmar = window.confirm(
              "¿Estás seguro de cerrar el formulario? El ticket permanecerá en su estado actual y podrás completar el reporte más tarde."
            );
            if (!confirmar) {
              return; // No cerrar el diálogo
            }
          }
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4 mb-6">
          <DialogTitle className="text-2xl font-bold">Reporte Técnico Alfapack</DialogTitle>
          <DialogDescription className="mt-2">
            Completa el reporte técnico. Puedes usar la IA para generar las secciones principales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Cliente */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="font-bold text-lg mb-4 bg-primary text-primary-foreground p-3 rounded-lg -mx-6 -mt-6 mb-6 shadow-md">CLIENTE</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">RAZÓN SOCIAL *</Label>
                <BuscarClientePipedrive
                  valorInicial={formData.razon_social || empresaInicial || ""}
                  onSeleccionar={(datos) => {
                    console.log(`[REPORTE] 📋 Datos recibidos de Pipedrive:`, datos);
                    // Actualizar TODOS los campos con los datos de Pipedrive
                    setFormData((prev) => ({
                      ...prev,
                      razon_social: datos.razon_social || "",
                      rut: datos.rut || "",
                      direccion: datos.direccion || "",
                      ciudad: datos.ciudad || "",
                      email_cliente: datos.email_cliente || ticketData.cliente_contacto || "",
                      telefono_fijo: datos.telefono_fijo || "",
                      celular: datos.celular || datos.telefono_fijo || "",
                      responsable: datos.responsable || "",
                    }));
                    console.log(`[REPORTE] ✅ Formulario actualizado con datos de Pipedrive:`, {
                      razon_social: datos.razon_social,
                      rut: datos.rut,
                      direccion: datos.direccion,
                      ciudad: datos.ciudad,
                      email_cliente: datos.email_cliente,
                      telefono_fijo: datos.telefono_fijo,
                      celular: datos.celular,
                      responsable: datos.responsable,
                    });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Escribe el nombre de la empresa para buscar en Pipedrive y autocompletar los datos
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">FECHA *</Label>
                <Input
                  className="bg-background"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">RUT</Label>
                <Input
                  className="bg-background"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  placeholder="RUT del cliente"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">PLANTA</Label>
                <Input
                  className="bg-background"
                  value={formData.planta}
                  onChange={(e) => setFormData({ ...formData, planta: e.target.value })}
                  placeholder="Planta/Facilidad"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">DIRECCIÓN</Label>
                <Input
                  className="bg-background"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Dirección"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">CIUDAD</Label>
                <Input
                  className="bg-background"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  placeholder="Ciudad"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">RESPONSABLE</Label>
                <Input
                  className="bg-background"
                  value={formData.responsable}
                  onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                  placeholder="Persona responsable"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">TELÉFONO FIJO</Label>
                <Input
                  className="bg-background"
                  value={formData.telefono_fijo}
                  onChange={(e) => setFormData({ ...formData, telefono_fijo: e.target.value })}
                  placeholder="Teléfono fijo"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  E-MAIL * 
                  <span className="text-xs text-muted-foreground ml-2">
                    (Se enviará el reporte a este correo)
                  </span>
                </Label>
                <Input
                  className="bg-background"
                  type="email"
                  value={formData.email_cliente || ticketData.cliente_contacto || ""}
                  onChange={(e) => setFormData({ ...formData, email_cliente: e.target.value })}
                  placeholder="email@ejemplo.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  El reporte se enviará automáticamente desde: soportetecnico@alfapack.cl
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">CELULAR</Label>
                <Input
                  className="bg-background"
                  value={formData.celular}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  placeholder="Celular"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-sm font-semibold">FACTURABLE</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.facturable}
                      onChange={(e) => setFormData({ ...formData, facturable: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                    />
                    <span className="font-medium">(SI)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={!formData.facturable}
                      onChange={(e) => setFormData({ ...formData, facturable: !e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                    />
                    <span className="font-medium">(NO)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Equipo */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="font-bold text-lg mb-4 bg-primary text-primary-foreground p-3 rounded-lg -mx-6 -mt-6 mb-6 shadow-md">EQUIPO</h3>
            <div className="space-y-2">
              {formData.equipos.map((equipo, index) => (
                <div key={index} className="grid grid-cols-4 gap-2">
                  <Input
                    className="bg-background"
                    placeholder="Máquina"
                    value={equipo.maquina}
                    onChange={(e) => {
                      const nuevosEquipos = [...formData.equipos];
                      nuevosEquipos[index].maquina = e.target.value;
                      setFormData({ ...formData, equipos: nuevosEquipos });
                    }}
                  />
                  <Input
                    className="bg-background"
                    placeholder="Modelo"
                    value={equipo.modelo}
                    onChange={(e) => {
                      const nuevosEquipos = [...formData.equipos];
                      nuevosEquipos[index].modelo = e.target.value;
                      setFormData({ ...formData, equipos: nuevosEquipos });
                    }}
                  />
                  <Input
                    className="bg-background"
                    placeholder="N° Serie"
                    value={equipo.numero_serie}
                    onChange={(e) => {
                      const nuevosEquipos = [...formData.equipos];
                      nuevosEquipos[index].numero_serie = e.target.value;
                      setFormData({ ...formData, equipos: nuevosEquipos });
                    }}
                  />
                  <div className="flex gap-2">
                    <Input
                      className="bg-background"
                      placeholder="Año"
                      value={equipo.ano}
                      onChange={(e) => {
                        const nuevosEquipos = [...formData.equipos];
                        nuevosEquipos[index].ano = e.target.value;
                        setFormData({ ...formData, equipos: nuevosEquipos });
                      }}
                    />
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            equipos: formData.equipos.filter((_, i) => i !== index),
                          });
                        }}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData({
                    ...formData,
                    equipos: [...formData.equipos, { maquina: "", modelo: "", numero_serie: "", ano: "" }],
                  });
                }}
              >
                + Agregar Equipo
              </Button>
            </div>
          </div>

          {/* Tipo de Servicio */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="font-bold text-lg mb-4 bg-primary text-primary-foreground p-3 rounded-lg -mx-6 -mt-6 mb-6 shadow-md">TIPO DE SERVICIO</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "garantia", label: "GARANTÍA" },
                { value: "contrato", label: "CONTRATO" },
                { value: "reparacion", label: "REPARACIÓN" },
                { value: "demostracion", label: "DEMOSTRACIÓN" },
                { value: "visita_cortesia", label: "VISITA DE CORTESÍA" },
                { value: "retiro_entrega", label: "RETIRO / ENTREGA" },
                { value: "puesta_marcha", label: "PUESTA EN MARCHA" },
                { value: "cotizacion", label: "COTIZACIÓN" },
                { value: "recuperacion", label: "RECUPERACIÓN" },
              ].map((tipo) => (
                <label key={tipo.value} className="flex items-center gap-2 cursor-pointer p-3 hover:bg-muted rounded-lg border transition-all hover:shadow-sm">
                    <input
                      type="checkbox"
                      checked={formData.tipo_servicio.includes(tipo.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            tipo_servicio: [...formData.tipo_servicio, tipo.value],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            tipo_servicio: formData.tipo_servicio.filter((t) => t !== tipo.value),
                          });
                        }
                      }}
                      className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                    />
                    <span className="text-sm font-semibold">{tipo.label}</span>
                  </label>
              ))}
            </div>
          </div>

          {/* Notas para IA */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <Label className="font-semibold mb-3 block">Notas del Trabajo (para generar con IA)</Label>
            <div className="flex gap-2 mt-2">
              <Textarea
                className="flex-1 bg-background min-h-[100px]"
                value={notasBrutas}
                onChange={(e) => setNotasBrutas(e.target.value)}
                placeholder='Ej: "cambie el flex y limpie ventilador, quedo joya"'
                rows={3}
              />
              <Button
                onClick={generarConIA}
                disabled={generando || !notasBrutas.trim()}
                variant="outline"
              >
                {generando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Escribe notas informales y la IA llenará automáticamente Diagnóstico, Trabajo Realizado y Observación
            </p>
          </div>

          {/* Diagnóstico */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="font-bold text-lg mb-4 bg-primary text-primary-foreground p-3 rounded-lg -mx-6 -mt-6 mb-6 shadow-md">DIAGNÓSTICO</h3>
            <Textarea
              className="bg-background min-h-[120px]"
              value={formData.diagnostico}
              onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
              placeholder="Describe el problema encontrado..."
              rows={4}
              required
            />
          </div>

          {/* Trabajo Realizado */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="font-bold text-lg mb-4 bg-primary text-primary-foreground p-3 rounded-lg -mx-6 -mt-6 mb-6 shadow-md">TRABAJO REALIZADO</h3>
            <Textarea
              className="bg-background min-h-[120px]"
              value={formData.trabajo_realizado}
              onChange={(e) => setFormData({ ...formData, trabajo_realizado: e.target.value })}
              placeholder="Describe detalladamente lo que se realizó..."
              rows={5}
              required
            />
          </div>

          {/* Observación */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="font-bold text-lg mb-4 bg-primary text-primary-foreground p-3 rounded-lg -mx-6 -mt-6 mb-6 shadow-md">OBSERVACIÓN</h3>
            <Textarea
              className="bg-background min-h-[100px]"
              value={formData.observacion}
              onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
              placeholder="Observaciones adicionales, recomendaciones..."
              rows={4}
            />
          </div>

          {/* Repuestos */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="font-bold text-lg mb-4 bg-primary text-primary-foreground p-3 rounded-lg -mx-6 -mt-6 mb-6 shadow-md">REPUESTOS Y/O MATERIALES UTILIZADOS</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 items-center text-xs font-semibold text-muted-foreground mb-2">
                <div className="col-span-2">CÓDIGO</div>
                <div className="col-span-2">CANTIDAD</div>
                <div className="col-span-5">DESCRIPCIÓN DE MERCADERÍAS</div>
                <div className="col-span-3">GARANTÍA</div>
              </div>
              {formData.repuestos.map((repuesto, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-2 bg-background"
                    placeholder="Código"
                    value={repuesto.codigo}
                    onChange={(e) => actualizarRepuesto(index, "codigo", e.target.value)}
                  />
                  <Input
                    className="col-span-2 bg-background"
                    placeholder="Cantidad"
                    value={repuesto.cantidad}
                    onChange={(e) => actualizarRepuesto(index, "cantidad", e.target.value)}
                  />
                  <Input
                    className="col-span-5 bg-background"
                    placeholder="Descripción"
                    value={repuesto.descripcion}
                    onChange={(e) => actualizarRepuesto(index, "descripcion", e.target.value)}
                  />
                  <div className="col-span-3 flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={repuesto.garantia}
                        onChange={(e) => actualizarRepuesto(index, "garantia", e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                      />
                      <span className="text-xs font-medium">SI</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={!repuesto.garantia}
                        onChange={(e) => actualizarRepuesto(index, "garantia", !e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                      />
                      <span className="text-xs font-medium">NO</span>
                    </label>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={agregarRepuesto} className="mt-2">
                + Agregar Repuesto
              </Button>
            </div>
          </div>

          {/* Tiempos */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="font-bold text-lg mb-4 bg-primary text-primary-foreground p-3 rounded-lg -mx-6 -mt-6 mb-6 shadow-md">TIEMPOS</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>HORA ENTRADA</Label>
                <Input
                  type="time"
                  value={formData.hora_entrada}
                  onChange={(e) => setFormData({ ...formData, hora_entrada: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>HORA SALIDA</Label>
                <Input
                  type="time"
                  value={formData.hora_salida}
                  onChange={(e) => setFormData({ ...formData, hora_salida: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>HORAS ESPERA</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.horas_espera}
                  onChange={(e) => setFormData({ ...formData, horas_espera: e.target.value })}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label>HORAS TRABAJO</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.horas_trabajo}
                  onChange={(e) => setFormData({ ...formData, horas_trabajo: e.target.value })}
                  placeholder="0.0"
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  title="Se calcula automáticamente: (Hora Salida - Hora Entrada) - Horas Espera"
                />
                <p className="text-xs text-muted-foreground">
                  Calculado automáticamente
                </p>
              </div>
              <div className="space-y-2">
                <Label>TIEMPO IDA</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.tiempo_ida}
                  onChange={(e) => setFormData({ ...formData, tiempo_ida: e.target.value })}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label>TIEMPO REGRESO</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.tiempo_regreso}
                  onChange={(e) => setFormData({ ...formData, tiempo_regreso: e.target.value })}
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>

          {/* Firma del Cliente */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="font-bold text-lg mb-4 bg-primary text-primary-foreground p-3 rounded-lg -mx-6 -mt-6 mb-6 shadow-md">FIRMA DEL CLIENTE</h3>
            <div className="space-y-4">
              {firmaCliente ? (
                <div className="border-2 border-primary rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Firma capturada:</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFirmaCliente(null)}
                    >
                      Cambiar Firma
                    </Button>
                  </div>
                  <img 
                    src={firmaCliente.imagen} 
                    alt="Firma del cliente" 
                    className="max-w-full h-24 object-contain border rounded"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {firmaCliente.nombre} - {new Date(firmaCliente.fecha).toLocaleString('es-CL')}
                  </p>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMostrarFirmaDialog(true)}
                  className="w-full"
                >
                  <Pen className="h-4 w-4 mr-2" />
                  Capturar Firma del Cliente
                </Button>
              )}
            </div>
          </div>

          {/* Firma del Técnico */}
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="font-bold text-lg mb-4 bg-primary text-primary-foreground p-3 rounded-lg -mx-6 -mt-6 mb-6 shadow-md">FIRMA DEL TÉCNICO</h3>
            <div className="space-y-4">
              {firmaTecnico ? (
                <div className="border-2 border-primary rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Firma capturada:</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFirmaTecnico(null)}
                    >
                      Cambiar Firma
                    </Button>
                  </div>
                  <img 
                    src={firmaTecnico.imagen} 
                    alt="Firma del técnico" 
                    className="max-w-full h-24 object-contain border rounded"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {firmaTecnico.nombre} - {new Date(firmaTecnico.fecha).toLocaleString('es-CL')}
                  </p>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMostrarFirmaTecnicoDialog(true)}
                  className="w-full"
                  disabled={!tecnicoNombre}
                >
                  <Pen className="h-4 w-4 mr-2" />
                  Capturar Firma del Técnico
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={() => setMostrarVistaPrevia(true)}
            disabled={!formData.diagnostico || !formData.trabajo_realizado}
          >
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
          <Button 
            variant="outline"
            onClick={() => guardarReporte(false)} 
            disabled={guardando || !formData.diagnostico || !formData.trabajo_realizado}
          >
            {guardando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
          <Button 
            onClick={guardarYEnviarReporte} 
            disabled={guardando || !formData.diagnostico || !formData.trabajo_realizado}
          >
            {guardando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando y Enviando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Guardar y Enviar
              </>
            )}
          </Button>
          {reporteGuardadoId && (
            <Button
              onClick={enviarPorWhatsApp}
              disabled={guardando}
              className="bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar por WhatsApp
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Vista Previa del Reporte */}
    {mostrarVistaPrevia && (
      <Dialog open={mostrarVistaPrevia} onOpenChange={setMostrarVistaPrevia}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-slate-900">
          <DialogHeader className="bg-slate-900">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl text-white">Vista Previa del Reporte Técnico</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Así se verá el reporte una vez guardado
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMostrarVistaPrevia(false)}
                className="text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-4 space-y-6 p-6">
            {/* Encabezado del Reporte */}
            <div className="border-b-2 border-orange-500 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  {appConfig?.logo && appConfig.logo.trim() !== "" ? (
                    <img 
                      src={appConfig.logo} 
                      alt="Logo" 
                      className="h-12 w-auto mb-2 max-w-xs object-contain"
                      onError={(e) => {
                        console.error("Error cargando logo:", appConfig.logo);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-white">{appConfig?.nombre || "α pack - Alfapack SpA"}</h1>
                  )}
                  <p className="text-sm text-gray-300 mt-1">
                    Rut: 76.802.874-5<br />
                    Av. Presidente Jorge Alessandri R. N°24429, San Bernardo, Santiago.<br />
                    Tel: +56 2323 33 610 - alfapack@alfapack.cl
                  </p>
                </div>
                <div className="bg-orange-500 text-white px-6 py-3 rounded text-right">
                  <div className="font-bold">REPORTE TÉCNICO</div>
                  <div className="text-2xl font-bold mt-1">N° {ticketId}</div>
                </div>
              </div>
            </div>

            {/* Información del Cliente */}
            <div className="bg-white p-4 rounded-md border border-gray-300">
              <h3 className="font-bold mb-3 text-lg bg-black text-white p-2 rounded -mx-4 -mt-4 mb-4">
                INFORMACIÓN DEL CLIENTE
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-700 font-semibold">Cliente: </span>
                  <span className="font-medium text-gray-900">{ticketData.cliente_nombre || "________________"}</span>
                </div>
                <div>
                  <span className="text-gray-700 font-semibold">Contacto: </span>
                  <span className="font-medium text-gray-900">{ticketData.cliente_contacto || "________________"}</span>
                </div>
                <div>
                  <span className="text-gray-700 font-semibold">Equipo: </span>
                  <span className="font-medium text-gray-900">{ticketData.dispositivo_modelo || "________________"}</span>
                </div>
                <div>
                  <span className="text-gray-700 font-semibold">Fecha: </span>
                  <span className="font-medium text-gray-900">{new Date().toLocaleDateString('es-CL', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>

            {/* Tipo de Servicio e Información Adicional */}
            <div className="bg-white p-4 rounded-md border border-gray-300">
              <h3 className="font-bold mb-3 text-lg bg-black text-white p-2 rounded -mx-4 -mt-4 mb-4">
                INFORMACIÓN DEL SERVICIO
              </h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-700 font-semibold">Tipo de Servicio: </span>
                  <span className="font-medium text-gray-900">
                    {formData.tipo_servicio && formData.tipo_servicio.length > 0 ? (
                      formData.tipo_servicio.map((tipo) => {
                        const tipoMap: Record<string, string> = {
                          "reparacion": "Reparación",
                          "garantia": "Garantía",
                          "mantenimiento": "Mantenimiento",
                          "visita_cortesia": "Visita de Cortesía",
                          "contrato": "Contrato",
                          "demostracion": "Demostración",
                          "retiro_entrega": "Retiro / Entrega",
                          "puesta_marcha": "Puesta en Marcha",
                          "cotizacion": "Cotización",
                          "recuperacion": "Recuperación",
                        };
                        return tipoMap[tipo] || tipo;
                      }).join(", ")
                    ) : "________________"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-700 font-semibold">Horas Trabajo: </span>
                  <span className="font-medium text-gray-900">{formData.horas_trabajo ? `${formData.horas_trabajo}h` : "________________"}</span>
                </div>
                <div>
                  <span className="text-gray-700 font-semibold">Horas Espera: </span>
                  <span className="font-medium text-gray-900">{formData.horas_espera ? `${formData.horas_espera}h` : "________________"}</span>
                </div>
                <div>
                  <span className="text-gray-700 font-semibold">Facturable: </span>
                  <span className="font-medium text-gray-900">{formData.facturable !== undefined ? (formData.facturable ? "Sí" : "No") : "________________"}</span>
                </div>
              </div>
            </div>

            {/* Diagnóstico */}
            <div>
              <h3 className="font-bold mb-2 text-lg bg-black text-white p-2 rounded">
                DIAGNÓSTICO
              </h3>
              <div className="bg-white p-4 rounded-md border-l-4 border-orange-500 min-h-[100px]">
                <p className="whitespace-pre-wrap text-gray-900">{formData.diagnostico || ""}</p>
              </div>
            </div>

            {/* Trabajo Realizado */}
            <div>
              <h3 className="font-bold mb-2 text-lg bg-black text-white p-2 rounded">
                TRABAJO REALIZADO
              </h3>
              <div className="bg-white p-4 rounded-md border-l-4 border-orange-500 min-h-[100px]">
                <p className="whitespace-pre-wrap text-gray-900">{formData.trabajo_realizado || ""}</p>
              </div>
            </div>

            {/* Observación */}
            <div>
              <h3 className="font-bold mb-2 text-lg bg-black text-white p-2 rounded">
                OBSERVACIÓN
              </h3>
              <div className="bg-white p-4 rounded-md border-l-4 border-orange-500 min-h-[100px]">
                <p className="whitespace-pre-wrap text-gray-900">{formData.observacion || ""}</p>
              </div>
            </div>

            {/* Repuestos */}
            {formData.repuestos.length > 0 && formData.repuestos.some(r => r.descripcion || r.codigo) && (
              <div>
                <h3 className="font-semibold mb-2 text-lg bg-black text-white p-2 rounded">
                  REPUESTOS Y/O MATERIALES UTILIZADOS
                </h3>
                <div className="bg-gray-50 p-4 rounded-md border-l-4 border-orange-500">
                  <div className="space-y-2">
                    {formData.repuestos
                      .filter(r => r.descripcion || r.codigo)
                      .map((repuesto, index) => (
                        <div key={index} className="p-2 bg-white rounded border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {repuesto.codigo && (
                                <div className="text-sm">
                                  <span className="font-semibold">Código: </span>
                                  <span>{repuesto.codigo}</span>
                                </div>
                              )}
                              {repuesto.descripcion && (
                                <div className="text-sm">
                                  <span className="font-semibold">Descripción: </span>
                                  <span>{repuesto.descripcion}</span>
                                </div>
                              )}
                              {repuesto.cantidad && (
                                <div className="text-sm">
                                  <span className="font-semibold">Cantidad: </span>
                                  <span>{repuesto.cantidad}</span>
                                </div>
                              )}
                            </div>
                            {repuesto.garantia && (
                              <Badge variant="outline" className="bg-yellow-50 ml-2">
                                Garantía
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pie de página */}
            <div className="border-t border-gray-600 pt-4 mt-6">
              <div className="grid grid-cols-2 gap-4 text-sm text-white">
                <div>
                  <span className="text-gray-300 font-semibold">Técnico Responsable: </span>
                  <span className="font-medium text-white">{tecnicoNombre || "[Tu nombre aparecerá aquí]"}</span>
                </div>
                <div>
                  <span className="text-gray-300 font-semibold">Fecha de Generación: </span>
                  <span className="text-white">{new Date().toLocaleString('es-CL', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 bg-slate-900">
            <Button
              variant="outline"
              onClick={() => setMostrarVistaPrevia(false)}
              className="border-gray-600 text-white hover:bg-slate-800"
            >
              Cerrar Vista Previa
            </Button>
            <Button
              onClick={() => {
                setMostrarVistaPrevia(false);
                guardarReporte(false);
              }}
              disabled={guardando || !formData.diagnostico || !formData.trabajo_realizado}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {guardando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Guardar Reporte
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}

      {/* Diálogo de Firma del Cliente - Para capturar antes de guardar */}
      <FirmaClienteDialog
        open={mostrarFirmaDialog && !reporteGuardadoId}
        onOpenChange={(open) => {
          setMostrarFirmaDialog(open);
        }}
        reporteId={0} // No se usa cuando se captura antes de guardar
        clienteNombre={formData.razon_social || ticketData.cliente_nombre || ""}
        onSuccess={(firmaData) => {
          // Guardar la firma en el estado local
          setFirmaCliente(firmaData || null);
          setMostrarFirmaDialog(false);
        }}
        capturaLocal={true} // Modo de captura local
      />
      
      {/* Diálogo de Firma del Cliente - Para reporte ya guardado */}
      {reporteGuardadoId && (
        <FirmaClienteDialog
          open={mostrarFirmaDialog && !!reporteGuardadoId}
          onOpenChange={(open) => {
            setMostrarFirmaDialog(open);
            if (!open) {
              onOpenChange(false);
              onSuccess();
              setReporteGuardadoId(null);
            }
          }}
          reporteId={reporteGuardadoId}
          clienteNombre={formData.razon_social || ticketData.cliente_nombre || ""}
          onSuccess={() => {
            setMostrarFirmaDialog(false);
            onOpenChange(false);
            onSuccess();
            setReporteGuardadoId(null);
          }}
        />
      )}

      {/* Diálogo de Firma del Técnico - Para capturar antes de guardar */}
      <FirmaTecnicoDialog
        open={mostrarFirmaTecnicoDialog && !reporteGuardadoId}
        onOpenChange={(open) => {
          setMostrarFirmaTecnicoDialog(open);
        }}
        reporteId={0} // No se usa cuando se captura antes de guardar
        tecnicoNombre={tecnicoNombre}
        onSuccess={(firmaData) => {
          // Guardar la firma en el estado local
          setFirmaTecnico(firmaData || null);
          setMostrarFirmaTecnicoDialog(false);
        }}
        capturaLocal={true} // Modo de captura local
      />
    </>
  );
}






