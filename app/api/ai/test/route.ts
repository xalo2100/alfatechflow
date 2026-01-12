import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai";
import { AIRequest } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { provider, prompt, model } = body;

        if (!provider || !prompt) {
            return NextResponse.json({ error: "Missing provider or prompt" }, { status: 400 });
        }

        const aiReq: AIRequest = {
            provider,
            model,
            messages: [
                { role: 'system', content: 'Eres un asistente útil y conciso.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
        };

        const response = await callAI(aiReq);
        return NextResponse.json(response);

    } catch (error: any) {
        console.error("[API AI TEST ERROR]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
