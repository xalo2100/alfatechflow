"use client";

import { Button } from "@/components/ui/button";
import { Grid3x3, List } from "lucide-react";

type ViewMode = "grid" | "list";

interface TicketViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function TicketViewToggle({ viewMode, onViewModeChange }: TicketViewToggleProps) {
  const handleGridClick = () => {
    console.log("Cambiando a grid");
    onViewModeChange("grid");
  };

  const handleListClick = () => {
    console.log("Cambiando a list");
    onViewModeChange("list");
  };

  return (
    <div className="flex items-center gap-1 border rounded-md p-1 bg-background">
      <Button
        type="button"
        variant={viewMode === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={handleGridClick}
        className="flex items-center gap-2"
      >
        <Grid3x3 className="h-4 w-4" />
        <span className="hidden sm:inline">Cuadrícula</span>
      </Button>
      <Button
        type="button"
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        onClick={handleListClick}
        className="flex items-center gap-2"
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">Lista</span>
      </Button>
    </div>
  );
}

