"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmarEliminarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarioNombre: string;
  usuarioRol: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmarEliminarDialog({
  open,
  onOpenChange,
  usuarioNombre,
  usuarioRol,
  onConfirm,
  loading = false,
}: ConfirmarEliminarDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            ¿Estás seguro de que deseas eliminar al usuario{" "}
            <strong>{usuarioNombre}</strong> ({usuarioRol})?
          </DialogDescription>
        </DialogHeader>
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 my-4">
          <p className="text-sm text-destructive font-medium">
            ⚠️ Esta acción no se puede deshacer. El usuario será eliminado
            permanentemente del sistema y no podrá iniciar sesión.
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Eliminando..." : "Eliminar Usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}




