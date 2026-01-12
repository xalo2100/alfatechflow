"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2, BrainCircuit, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function TestAIPage() {
    const [prompt, setPrompt] = useState("Hola, ¿quién eres y qué modelo de IA estás usando?");
    const [provider, setProvider] = useState("local");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleTest = async () => {
        if (!prompt) return;
        setLoading(true);
        setResult(null);

        try {
            const resp = await fetch("/api/ai/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider, prompt }),
            });

            const data = await resp.json();
            if (data.error) throw new Error(data.error);

            setResult(data);
            toast.success(`Respuesta recibida de ${provider}`);
        } catch (error: any) {
            console.error(error);
            toast.error(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <Button
                variant="ghost"
                onClick={() => window.location.href = '/admin'}
                className="mb-4"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Panel
            </Button>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <BrainCircuit className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Playground de IA Híbrida</h1>
                    <p className="text-muted-foreground">Prueba los diferentes modelos configurados en la arquitectura.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configuración de Prueba</CardTitle>
                    <CardDescription>Selecciona un proveedor y envía un mensaje.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Proveedor</Label>
                            <Select value={provider} onValueChange={setProvider}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="local">Nube Local (VPS phi3)</SelectItem>
                                    <SelectItem value="gemini">Gemini 2.0 (Google)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Mensaje / Prompt</Label>
                        <Input
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Escribe algo para probar la IA..."
                        />
                    </div>

                    <Button
                        onClick={handleTest}
                        disabled={loading || !prompt}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 mr-2" />
                        )}
                        Probar Conexión
                    </Button>
                </CardContent>
            </Card>

            {result && (
                <Card className="border-green-200 bg-green-50/30 animate-in fade-in slide-in-from-bottom-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                            <CardTitle className="text-sm font-medium">Resultado de la IA</CardTitle>
                            <CardDescription>
                                Modelo: <Badge variant="secondary">{result.model}</Badge>
                            </CardDescription>
                        </div>
                        <Sparkles className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-white rounded-md border border-green-100 text-sm leading-relaxed whitespace-pre-wrap">
                            {result.content}
                        </div>

                        <div className="flex gap-4 text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                            <span>Tokens Prompt: {result.usage.promptTokens}</span>
                            <span>Tokens Comp: {result.usage.completionTokens}</span>
                            <span>Total: {result.usage.totalTokens}</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
