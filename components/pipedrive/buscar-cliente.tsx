"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X } from "lucide-react";

interface ClientePipedrive {
  id: number;
  name: string;
  formulario: {
    razon_social: string;
    rut?: string;
    direccion?: string;
    ciudad?: string;
    email_cliente?: string;
    telefono_fijo?: string;
    celular?: string;
    responsable?: string;
  };
}

interface BuscarClientePipedriveProps {
  onSeleccionar: (datos: ClientePipedrive["formulario"]) => void;
  valorInicial?: string;
  disabled?: boolean;
}

export function BuscarClientePipedrive({
  onSeleccionar,
  valorInicial = "",
  disabled = false,
}: BuscarClientePipedriveProps) {
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<ClientePipedrive[]>([]);
  const [query, setQuery] = useState(valorInicial);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sincronizar query con valorInicial si cambia externamente
    if (valorInicial !== undefined && valorInicial !== query) {
      setQuery(valorInicial);
    }
  }, [valorInicial]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setMostrarResultados(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const buscar = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResultados([]);
      setMostrarResultados(false);
      return;
    }

    setBuscando(true);
    console.log(`[FRONTEND] 🔍 Buscando: "${searchQuery}"`);
    try {
      const url = `/api/pipedrive/buscar-organizacion?q=${encodeURIComponent(searchQuery)}`;
      console.log(`[FRONTEND] 🔗 URL: ${url}`);

      const response = await fetch(url);

      console.log(`[FRONTEND] 📡 Status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        console.error(`[FRONTEND] ❌ Error:`, errorData);
        setResultados([]);
        setMostrarResultados(false);
        return;
      }

      const data = await response.json();
      console.log(`[FRONTEND] 📊 Respuesta completa:`, JSON.stringify(data, null, 2));
      console.log(`[FRONTEND] 📊 Resultados encontrados: ${data.resultados?.length || 0}`);

      const resultadosArray = data.resultados || [];
      console.log(`[FRONTEND] 📋 Array de resultados:`, resultadosArray);

      setResultados(resultadosArray);
      const tieneResultados = resultadosArray.length > 0;
      setMostrarResultados(tieneResultados);

      if (!tieneResultados) {
        console.warn(`[FRONTEND] ⚠️ No se encontraron resultados para: "${searchQuery}"`);
        console.warn(`[FRONTEND] ⚠️ Respuesta recibida:`, data);
      } else {
        console.log(`[FRONTEND] ✅ Mostrando ${resultadosArray.length} resultado(s)`);
      }
    } catch (error: any) {
      console.error(`[FRONTEND] ❌ Error en búsqueda:`, error);
      console.error(`[FRONTEND] Mensaje:`, error.message);
      setResultados([]);
      setMostrarResultados(false);
    } finally {
      setBuscando(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce: esperar 500ms antes de buscar
    timeoutRef.current = setTimeout(() => {
      if (value.length >= 2) {
        buscar(value);
      } else {
        setResultados([]);
        setMostrarResultados(false);
      }
    }, 500);
  };

  const handleSeleccionar = (cliente: ClientePipedrive) => {
    console.log(`[BUSCAR-CLIENTE] 🎯 Cliente seleccionado:`, cliente);
    console.log(`[BUSCAR-CLIENTE] 📋 Datos del formulario:`, cliente.formulario);
    setQuery(cliente.name);
    setMostrarResultados(false);
    onSeleccionar(cliente.formulario);
  };

  const handleLimpiar = () => {
    setQuery("");
    setResultados([]);
    setMostrarResultados(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (resultados.length > 0) {
              setMostrarResultados(true);
            }
            // Si hay texto, buscar automáticamente al enfocar
            if (query.length >= 2) {
              buscar(query);
              setMostrarResultados(true);
            }
          }}
          placeholder="Buscar empresa en Pipedrive..."
          disabled={disabled}
          className="pl-9 pr-9"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full w-8"
            onClick={handleLimpiar}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Lista de resultados */}
      {mostrarResultados && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {buscando ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">
                Buscando en Pipedrive...
              </span>
            </div>
          ) : resultados.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {query.length < 2
                ? "Escribe al menos 2 caracteres para buscar"
                : "No se encontraron clientes"}
            </div>
          ) : (
            <div className="py-1">
              {resultados.map((cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => handleSeleccionar(cliente)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                >
                  <div className="flex flex-col">
                    <div className="font-semibold text-sm text-gray-900">{cliente.name}</div>
                    {cliente.formulario.rut && (
                      <div className="text-xs text-gray-500">
                        RUT: {cliente.formulario.rut}
                      </div>
                    )}
                    {cliente.formulario.email_cliente && (
                      <div className="text-xs text-gray-500">
                        {cliente.formulario.email_cliente}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

