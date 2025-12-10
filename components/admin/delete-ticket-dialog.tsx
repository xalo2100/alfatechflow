"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DeleteTicketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket: {
        id: number;
        estado: string;
        tecnico_asignado_id?: string;
        tecnico_nombre?: string;
        cliente_nombre?: string;
        reportes_count?: number;
    };
    onConfirmDelete: () => Promise<void>;
}

export function DeleteTicketDialog({
    open,
    onOpenChange,
    ticket,
    onConfirmDelete,
}: DeleteTicketDialogProps) {
    const [confirmIrreversible, setConfirmIrreversible] = useState(false);
    const [confirmVerified, setConfirmVerified] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirmIrreversible || !confirmVerified) {
            return;
        }

        setDeleting(true);
        try {
            await onConfirmDelete();
            // Reset state
            setConfirmIrreversible(false);
            setConfirmVerified(false);
            onOpenChange(false);
        } catch (error) {
            console.error("Error deleting ticket:", error);
        } finally {
            setDeleting(false);
        }
    };

    const canDelete = confirmIrreversible && confirmVerified;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <DialogTitle>Eliminar Ticket #{ticket.id}</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        Esta acción es <strong>irreversible</strong>. Por favor, revisa la
                        información antes de continuar.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Información del ticket */}
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Estado:</span>
                            <Badge variant="outline">{ticket.estado}</Badge>
                        </div>

                        {ticket.cliente_nombre && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Cliente:</span>
                                <span className="text-sm text-muted-foreground">
                                    {ticket.cliente_nombre}
                                </span>
                            </div>
                        )}

                        {ticket.tecnico_asignado_id && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Asignado a:</span>
                                <Badge variant="secondary">
                                    {ticket.tecnico_nombre || "Técnico"}
                                </Badge>
                            </div>
                        )}

                        {ticket.reportes_count !== undefined && ticket.reportes_count > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Reportes asociados:</span>
                                <Badge variant="destructive">{ticket.reportes_count}</Badge>
                            </div>
                        )}
                    </div>

                    {/* Checkboxes de confirmación */}
                    <div className="space-y-3">
                        <div className="flex items-start space-x-2">
                            <Checkbox
                                id="irreversible"
                                checked={confirmIrreversible}
                                onCheckedChange={(checked) =>
                                    setConfirmIrreversible(checked as boolean)
                                }
                            />
                            <Label
                                htmlFor="irreversible"
                                className="text-sm font-normal leading-tight cursor-pointer"
                            >
                                Entiendo que esta acción es <strong>IRREVERSIBLE</strong> y no
                                se puede deshacer
                            </Label>
                        </div>

                        <div className="flex items-start space-x-2">
                            <Checkbox
                                id="verified"
                                checked={confirmVerified}
                                onCheckedChange={(checked) =>
                                    setConfirmVerified(checked as boolean)
                                }
                            />
                            <Label
                                htmlFor="verified"
                                className="text-sm font-normal leading-tight cursor-pointer"
                            >
                                He verificado que este ticket <strong>debe ser eliminado</strong>
                            </Label>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={deleting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!canDelete || deleting}
                    >
                        {deleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Eliminando...
                            </>
                        ) : (
                            "Eliminar Ticket"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
