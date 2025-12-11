import JSZip from 'jszip';
import * as XLSX from 'xlsx';

export interface ReporteExportData {
    ticket_id: number;
    cliente_nombre: string;
    tecnico_nombre: string;
    fecha: string;
    tipo_servicio: string;
    facturable: string;
    costo: number;
    estado: string;
}

/**
 * Exporta reportes a Excel
 */
export async function exportarReportesExcel(reportes: ReporteExportData[], filename: string = 'reportes.xlsx') {
    // Crear workbook
    const wb = XLSX.utils.book_new();

    // Convertir datos a formato de hoja
    const ws = XLSX.utils.json_to_sheet(reportes.map(r => ({
        'Ticket #': r.ticket_id,
        'Cliente': r.cliente_nombre,
        'Técnico': r.tecnico_nombre,
        'Fecha': r.fecha,
        'Tipo de Servicio': r.tipo_servicio,
        'Facturable': r.facturable,
        'Costo': r.costo,
        'Estado': r.estado,
    })));

    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Reportes');

    // Descargar archivo
    XLSX.writeFile(wb, filename);
}

/**
 * Exporta reportes a CSV
 */
export async function exportarReportesCSV(reportes: ReporteExportData[], filename: string = 'reportes.csv') {
    // Crear workbook
    const wb = XLSX.utils.book_new();

    // Convertir datos a formato de hoja
    const ws = XLSX.utils.json_to_sheet(reportes.map(r => ({
        'Ticket #': r.ticket_id,
        'Cliente': r.cliente_nombre,
        'Técnico': r.tecnico_nombre,
        'Fecha': r.fecha,
        'Tipo de Servicio': r.tipo_servicio,
        'Facturable': r.facturable,
        'Costo': r.costo,
        'Estado': r.estado,
    })));

    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Reportes');

    // Descargar como CSV
    XLSX.writeFile(wb, filename, { bookType: 'csv' });
}

/**
 * Crea un ZIP con múltiples PDFs
 */
export async function crearZipConPDFs(pdfs: Array<{ nombre: string; blob: Blob }>, zipFilename: string = 'reportes.zip') {
    const zip = new JSZip();

    // Agregar cada PDF al ZIP
    for (const pdf of pdfs) {
        zip.file(pdf.nombre, pdf.blob);
    }

    // Generar ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Descargar ZIP
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = zipFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Convierte un data URL a Blob
 */
export function dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}
