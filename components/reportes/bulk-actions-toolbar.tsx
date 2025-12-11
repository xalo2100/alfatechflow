"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Printer, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BulkActionsToolbarProps {
    selectedCount: number;
    onDownloadPDF: () => void;
    onPrint: () => void;
    onExportExcel: () => void;
    onExportCSV: () => void;
    onClearSelection: () => void;
    loading?: boolean;
}

export function BulkActionsToolbar({
    selectedCount,
    onDownloadPDF,
    onPrint,
    onExportExcel,
    onExportCSV,
    onClearSelection,
    loading = false,
}: BulkActionsToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-primary text-primary-foreground shadow-lg rounded-lg px-6 py-4 flex items-center gap-4">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                    {selectedCount} {selectedCount === 1 ? 'reporte seleccionado' : 'reportes seleccionados'}
                </Badge>

                <div className="h-6 w-px bg-primary-foreground/20" />

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={onDownloadPDF}
                        disabled={loading}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                    </Button>

                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={onPrint}
                        disabled={loading}
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                    </Button>

                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={onExportExcel}
                        disabled={loading}
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                    </Button>

                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={onExportCSV}
                        disabled={loading}
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        CSV
                    </Button>
                </div>

                <div className="h-6 w-px bg-primary-foreground/20" />

                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClearSelection}
                    disabled={loading}
                    className="hover:bg-primary-foreground/10"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
