import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReporteData {
    razon_social?: string;
    rut?: string;
    planta?: string;
    direccion?: string;
    ciudad?: string;
    responsable?: string;
    telefono_fijo?: string;
    email_cliente?: string;
    celular?: string;
    facturable?: boolean;
    equipos?: Array<{
        maquina?: string;
        modelo?: string;
        numero_serie?: string;
        ano?: string;
    }>;
    tipo_servicio?: string[];
    diagnostico?: string;
    trabajo_realizado?: string;
    observacion?: string;
    repuestos?: Array<{
        codigo?: string;
        cantidad?: string;
        descripcion?: string;
        garantia?: boolean;
    }>;
    hora_entrada?: string;
    hora_salida?: string;
    horas_espera?: string;
    horas_trabajo?: string;
    tiempo_ida?: string;
    tiempo_regreso?: string;
    firma_tecnico?: {
        nombre: string;
        imagen: string;
        fecha: string;
    };
    firma_cliente?: {
        nombre: string;
        imagen: string;
        fecha: string;
    };
    fecha?: string;
}

interface Reporte {
    id: number;
    ticket_id: number;
    reporte_ia: string;
    created_at: string;
    costo_reparacion?: number;
    ticket?: {
        cliente_nombre: string;
        dispositivo_modelo?: string;
        numero_serie?: string;
    };
    tecnico?: {
        nombre_completo: string;
    };
}

interface AppConfig {
    nombre?: string;
    logo?: string;
}

export function generarPDFDirecto(reporte: Reporte, appConfig?: AppConfig): ArrayBuffer {
    console.log('[PDF] Iniciando generación de PDF directo');
    console.log('[PDF] Configuración de app:', appConfig);
    const pdf = new jsPDF('p', 'mm', 'a4');

    let reporteData: ReporteData = {};
    try {
        if (typeof reporte.reporte_ia === 'string') {
            reporteData = JSON.parse(reporte.reporte_ia);
        } else if (typeof reporte.reporte_ia === 'object') {
            reporteData = reporte.reporte_ia;
        }
        console.log('[PDF] Datos del reporte procesados:', reporteData);
    } catch (error) {
        console.error('[PDF] Error procesando reporte_ia:', error);
        reporteData = {};
    }

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper para verificar si necesitamos nueva página
    const checkNewPage = (requiredSpace: number = 20) => {
        if (yPos + requiredSpace > pageHeight - margin) {
            pdf.addPage();
            yPos = margin;
            return true;
        }
        return false;
    };

    // ENCABEZADO - Página 1
    // Logo y datos de empresa (izquierda)
    const nombreEmpresa = appConfig?.nombre || 'α pack - Alfapack SpA';
    const logoUrl = appConfig?.logo;

    if (logoUrl) {
        try {
            // Intentar agregar logo
            // Asumimos que logoUrl es base64 o una URL accesible
            // Ajustamos posición y tamaño (dimensión cuadrada solicitada)
            // Logo de 35x30mm (más ancho como solicitado)
            pdf.addImage(logoUrl, 'PNG', margin, yPos, 35, 30, undefined, 'FAST');

            // Mover cursor debajo del logo
            yPos += 35;
        } catch (e) {
            console.error("Error agregando logo al PDF:", e);
            // Fallback a texto
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(255, 102, 0);
            pdf.text(nombreEmpresa, margin, yPos + 5);
            yPos += 15;
        }
    } else {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 102, 0); // Naranja Alfapack
        pdf.text(nombreEmpresa, margin, yPos + 5);
        yPos += 15;
    }

    pdf.setFontSize(7);
    pdf.setTextColor(80, 80, 80);
    pdf.text('Rut: 76.802.874-5', margin, yPos);
    yPos += 3;
    pdf.text('Av. Presidente Jorge Alessandri R. N°24429, San Bernardo, Santiago.', margin, yPos);
    yPos += 3;
    pdf.text('Tel: +56 2323 33 610 - alfapack@alfapack.cl', margin, yPos);

    // Número de reporte (derecha)
    pdf.setFillColor(255, 102, 0);
    pdf.roundedRect(pageWidth - margin - 50, 15, 50, 20, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORTE TÉCNICO', pageWidth - margin - 48, 22);
    pdf.setFontSize(16);
    pdf.text(`N° ${reporte.ticket_id}`, pageWidth - margin - 48, 30);

    // Línea separadora
    yPos += 8;
    pdf.setDrawColor(255, 102, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 8;

    // INFORMACIÓN DEL CLIENTE
    pdf.setFillColor(60, 60, 60);
    pdf.rect(margin, yPos, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INFORMACIÓN DEL CLIENTE', margin + 2, yPos + 5.5);

    yPos += 10;
    pdf.setTextColor(0, 0, 0); // Asegurar negro
    pdf.setFontSize(8);

    // Grid de información del cliente (2 columnas)
    const colWidth = contentWidth / 2;
    let col1Y = yPos;
    let col2Y = yPos;

    const addClientInfo = (label: string, value: string, column: 1 | 2) => {
        const x = column === 1 ? margin : margin + colWidth;
        const currentY = column === 1 ? col1Y : col2Y;

        pdf.setFillColor(245, 245, 245);
        pdf.rect(x, currentY, colWidth - 2, 10, 'F');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        pdf.text(label, x + 2, currentY + 4);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.text(value || 'N/A', x + 2, currentY + 8);

        if (column === 1) {
            col1Y += 12;
        } else {
            col2Y += 12;
        }
    };

    addClientInfo('Razón Social', reporteData.razon_social || reporte.ticket?.cliente_nombre || '', 1);
    addClientInfo('Fecha', reporteData.fecha || format(new Date(reporte.created_at), 'dd MMM yyyy', { locale: es }), 2);
    addClientInfo('RUT', reporteData.rut || '', 1);
    addClientInfo('Planta', reporteData.planta || 'N/A', 2);
    addClientInfo('Dirección', reporteData.direccion || '', 1);
    addClientInfo('Ciudad', reporteData.ciudad || '', 2);
    addClientInfo('Responsable', reporteData.responsable || '', 1);
    addClientInfo('Teléfono Fijo', reporteData.telefono_fijo || '', 2);
    addClientInfo('E-mail', reporteData.email_cliente || '', 1);
    addClientInfo('Celular', reporteData.celular || '', 2);
    addClientInfo('Facturable', reporteData.facturable ? 'SI' : 'NO', 1);

    yPos = Math.max(col1Y, col2Y) + 5;

    // EQUIPO (si hay datos)
    if (reporteData.equipos && reporteData.equipos.length > 0 && reporteData.equipos.some(e => e.maquina || e.modelo)) {
        checkNewPage(40);
        pdf.setFillColor(60, 60, 60);
        pdf.rect(margin, yPos, contentWidth, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('EQUIPO', margin + 2, yPos + 5.5);

        yPos += 10;

        // Tabla de equipos
        const tableHeaders = ['Máquina', 'Modelo', 'N° Serie', 'Año'];
        const colWidths = [45, 45, 45, 45];
        let xPos = margin;

        // Headers
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPos, contentWidth, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        tableHeaders.forEach((header, i) => {
            pdf.text(header, xPos + 2, yPos + 5.5);
            xPos += colWidths[i];
        });

        yPos += 8;

        // Rows
        pdf.setFont('helvetica', 'normal');
        reporteData.equipos.forEach(equipo => {
            xPos = margin;
            pdf.setDrawColor(200, 200, 200);
            pdf.rect(margin, yPos, contentWidth, 8);

            pdf.text(equipo.maquina || 'N/A', xPos + 2, yPos + 5.5);
            xPos += colWidths[0];
            pdf.text(equipo.modelo || 'N/A', xPos + 2, yPos + 5.5);
            xPos += colWidths[1];
            pdf.text(equipo.numero_serie || 'N/A', xPos + 2, yPos + 5.5);
            xPos += colWidths[2];
            pdf.text(equipo.ano || 'N/A', xPos + 2, yPos + 5.5);

            yPos += 8;
        });

        yPos += 5;
    }

    // NUEVA PÁGINA - Tipo de Servicio
    pdf.addPage();
    yPos = margin;

    // TIPO DE SERVICIO
    if (reporteData.tipo_servicio && reporteData.tipo_servicio.length > 0) {
        pdf.setFillColor(60, 60, 60);
        pdf.rect(margin, yPos, contentWidth, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TIPO DE SERVICIO', margin + 2, yPos + 5.5);

        yPos += 12;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');

        const tipoMap: Record<string, string> = {
            'garantia': 'GARANTÍA',
            'contrato': 'CONTRATO',
            'reparacion': 'REPARACIÓN',
            'demostracion': 'DEMOSTRACIÓN',
            'visita_cortesia': 'VISITA DE CORTESÍA',
            'retiro_entrega': 'RETIRO / ENTREGA',
            'puesta_marcha': 'PUESTA EN MARCHA',
            'cotizacion': 'COTIZACIÓN',
            'recuperacion': 'RECUPERACIÓN'
        };

        const tiposTexto = reporteData.tipo_servicio.map(t => tipoMap[t] || t).join(', ');
        pdf.text(tiposTexto, margin + 2, yPos);
        yPos += 10;
    }

    // DIAGNÓSTICO
    if (reporteData.diagnostico) {
        const diagnosticoLines = pdf.splitTextToSize(reporteData.diagnostico, contentWidth - 10);
        const boxHeight = diagnosticoLines.length * 5 + 6;

        // Verificar si cabe todo (header + contenido)
        checkNewPage(20 + boxHeight);

        pdf.setFillColor(60, 60, 60);
        pdf.rect(margin, yPos, contentWidth, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DIAGNÓSTICO', margin + 2, yPos + 5.5);

        yPos += 10;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');

        // Caja con borde gris (unificado)
        pdf.setDrawColor(200, 200, 200); // Gris
        pdf.setLineWidth(0.1);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(margin, yPos, contentWidth, boxHeight);

        // Línea naranja a la izquierda
        pdf.setDrawColor(255, 102, 0);
        pdf.setLineWidth(2);
        pdf.line(margin, yPos, margin, yPos + boxHeight);

        let textY = yPos + 5;
        diagnosticoLines.forEach((line: string) => {
            pdf.text(line, margin + 5, textY);
            textY += 5;
        });

        yPos += boxHeight + 5;
    }

    // TRABAJO REALIZADO
    if (reporteData.trabajo_realizado) {
        const trabajoLines = pdf.splitTextToSize(reporteData.trabajo_realizado, contentWidth - 10);
        const boxHeight = trabajoLines.length * 5 + 6;

        checkNewPage(20 + boxHeight);

        pdf.setFillColor(60, 60, 60);
        pdf.rect(margin, yPos, contentWidth, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TRABAJO REALIZADO', margin + 2, yPos + 5.5);

        yPos += 10;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');

        // Caja con borde gris (unificado)
        pdf.setDrawColor(200, 200, 200); // Gris
        pdf.setLineWidth(0.1);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(margin, yPos, contentWidth, boxHeight);

        // Línea naranja a la izquierda
        pdf.setDrawColor(255, 102, 0);
        pdf.setLineWidth(2);
        pdf.line(margin, yPos, margin, yPos + boxHeight);

        let textY = yPos + 5;
        trabajoLines.forEach((line: string) => {
            pdf.text(line, margin + 5, textY);
            textY += 5;
        });

        yPos += boxHeight + 5;
    }

    // OBSERVACIÓN
    if (reporteData.observacion) {
        const obsLines = pdf.splitTextToSize(reporteData.observacion, contentWidth - 10);
        const boxHeight = obsLines.length * 5 + 6;

        checkNewPage(20 + boxHeight);

        pdf.setFillColor(60, 60, 60);
        pdf.rect(margin, yPos, contentWidth, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('OBSERVACIÓN', margin + 2, yPos + 5.5);

        yPos += 10;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');

        // Caja con borde gris (unificado)
        pdf.setDrawColor(200, 200, 200); // Gris
        pdf.setLineWidth(0.1);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(margin, yPos, contentWidth, boxHeight);

        // Línea naranja a la izquierda
        pdf.setDrawColor(255, 102, 0);
        pdf.setLineWidth(2);
        pdf.line(margin, yPos, margin, yPos + boxHeight);

        let textY = yPos + 5;
        obsLines.forEach((line: string) => {
            pdf.text(line, margin + 5, textY);
            textY += 5;
        });

        yPos += boxHeight + 5;
    }

    // REPUESTOS
    if (reporteData.repuestos && reporteData.repuestos.length > 0 && reporteData.repuestos.some(r => r.descripcion || r.codigo)) {
        checkNewPage(40);
        pdf.setFillColor(60, 60, 60);
        pdf.rect(margin, yPos, contentWidth, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('REPUESTOS Y/O MATERIALES UTILIZADOS', margin + 2, yPos + 5.5);

        yPos += 10;

        // Tabla de repuestos
        const repHeaders = ['Código', 'Cantidad', 'Descripción de Mercaderías', 'Garantía'];
        const repColWidths = [30, 25, 85, 25];
        let xPos = margin;

        // Headers
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPos, contentWidth, 8, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        repHeaders.forEach((header, i) => {
            pdf.text(header, xPos + 2, yPos + 5.5);
            xPos += repColWidths[i];
        });

        yPos += 8;

        // Rows
        pdf.setFont('helvetica', 'normal');
        reporteData.repuestos.forEach(rep => {
            if (!rep.descripcion && !rep.codigo) return;

            xPos = margin;
            pdf.setDrawColor(200, 200, 200);
            pdf.rect(margin, yPos, contentWidth, 8);

            pdf.text(rep.codigo || 'N/A', xPos + 2, yPos + 5.5);
            xPos += repColWidths[0];
            pdf.text(rep.cantidad || '', xPos + 2, yPos + 5.5);
            xPos += repColWidths[1];
            const descLines = pdf.splitTextToSize(rep.descripcion || 'N/A', repColWidths[2] - 4);
            pdf.text(descLines[0], xPos + 2, yPos + 5.5);
            xPos += repColWidths[2];
            pdf.text(rep.garantia ? 'SI' : 'NO', xPos + 2, yPos + 5.5);

            yPos += 8;
        });

        yPos += 5;
    }

    // TIEMPOS
    if (reporteData.hora_entrada || reporteData.hora_salida || reporteData.horas_trabajo) {
        checkNewPage(50);
        pdf.setFillColor(60, 60, 60);
        pdf.rect(margin, yPos, contentWidth, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TIEMPOS', margin + 2, yPos + 5.5);

        yPos += 12;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);

        const tiempoColWidth = contentWidth / 2;
        let tiempoCol1Y = yPos;
        let tiempoCol2Y = yPos;

        const addTiempoInfo = (label: string, value: string, column: 1 | 2) => {
            const x = column === 1 ? margin : margin + tiempoColWidth;
            const currentY = column === 1 ? tiempoCol1Y : tiempoCol2Y;

            pdf.setFillColor(245, 245, 245);
            pdf.rect(x, currentY, tiempoColWidth - 2, 10, 'F');
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            pdf.setTextColor(100, 100, 100);
            pdf.text(label, x + 2, currentY + 4);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.setTextColor(0, 0, 0);
            pdf.text(value, x + 2, currentY + 8);

            if (column === 1) {
                tiempoCol1Y += 12;
            } else {
                tiempoCol2Y += 12;
            }
        };

        addTiempoInfo('Hora Entrada', reporteData.hora_entrada || 'N/A', 1);
        addTiempoInfo('Hora Salida', reporteData.hora_salida || 'N/A', 2);
        addTiempoInfo('Horas Espera', reporteData.horas_espera ? `${reporteData.horas_espera}h` : 'N/A', 1);
        addTiempoInfo('Horas Trabajo', reporteData.horas_trabajo ? `${reporteData.horas_trabajo}h` : 'N/A', 2);
        addTiempoInfo('Tiempo Ida', reporteData.tiempo_ida ? `${reporteData.tiempo_ida}h` : 'N/A', 1);
        addTiempoInfo('Tiempo Regreso', reporteData.tiempo_regreso ? `${reporteData.tiempo_regreso}h` : 'N/A', 2);

        yPos = Math.max(tiempoCol1Y, tiempoCol2Y) + 10;
    }

    // FIRMAS
    checkNewPage(60);
    yPos += 10;

    // FIRMAS
    checkNewPage(60);
    yPos += 10;

    const firmaStartY = yPos;

    // Técnico (Izquierda)
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Técnico', margin, yPos);
    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    pdf.text(reporte.tecnico?.nombre_completo || 'N/A', margin, yPos);
    yPos += 10;

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('NOMBRE Y FIRMA TÉCNICO', margin, yPos);

    if (reporteData.firma_tecnico?.imagen) {
        yPos += 5;
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        // Solo nombre, sin "Firmado por:"
        pdf.text(reporteData.firma_tecnico.nombre, margin, yPos);

        try {
            // Intentar agregar imagen de firma
            pdf.addImage(reporteData.firma_tecnico.imagen, 'PNG', margin, yPos + 2, 40, 20, undefined, 'FAST');
        } catch (e) {
            console.error("Error agregando firma técnico:", e);
        }
    }

    const firmaTecnicoEndY = yPos + 25;

    // Cliente (Derecha) - Usar firmaStartY para alinear
    yPos = firmaStartY;

    // Fecha de generación (alineada con el bloque derecho)
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Fecha de Generación', pageWidth - margin - 50, yPos);

    // Ajuste para que la fecha quede bien posicionada
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(format(new Date(reporte.created_at), 'dd MMM yyyy, HH:mm', { locale: es }), pageWidth - margin - 50, yPos + 5);

    // Alinear con el bloque de técnico
    yPos += 15;

    if (reporteData.firma_cliente?.nombre) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        pdf.text('NOMBRE Y FIRMA CLIENTE', pageWidth - margin - 50, yPos);

        yPos += 5;
        // Solo nombre, sin "Firmado por:"
        pdf.text(reporteData.firma_cliente.nombre, pageWidth - margin - 50, yPos);

        if (reporteData.firma_cliente.imagen) {
            try {
                // Intentar agregar imagen de firma
                pdf.addImage(reporteData.firma_cliente.imagen, 'PNG', pageWidth - margin - 50, yPos + 2, 40, 20, undefined, 'FAST');
            } catch (e) {
                console.error("Error agregando firma cliente:", e);
            }
        }
    }

    const firmaClienteEndY = yPos + 25;

    // Actualizar yPos al máximo de los dos bloques
    yPos = Math.max(firmaTecnicoEndY, firmaClienteEndY);

    // Pie de página final
    yPos = pageHeight - 15;
    pdf.setFontSize(7);
    pdf.setTextColor(150, 150, 150);
    pdf.text('ORIGINAL: CLIENTE | 1ª COPIA: SERVICIO TÉCNICO | 2ª COPIA: CONTROL INTERNO', pageWidth / 2, yPos, { align: 'center' });

    console.log('[PDF] PDF generado exitosamente');
    return pdf.output('arraybuffer');
}
