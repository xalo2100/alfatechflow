import { AIProviderImplementation, AIRequest, AIResponse } from "../types";

export class LocalVPSProvider implements AIProviderImplementation {
    async call(req: AIRequest): Promise<AIResponse> {
        const url = process.env.DYNAMIC_LOCAL_AI_URL || process.env.LOCAL_AI_URL || "http://184.174.36.189:3000/v1/chat";
        const modelName = req.model || "phi3";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: modelName,
                messages: req.messages,
                temperature: req.temperature ?? 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error(`Local VPS Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Suponiendo formato OpenAI standard: choices[0].message.content
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Invalid response format from Local VPS");
        }

        return {
            content: data.choices[0].message.content,
            usage: {
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0,
            },
            model: modelName,
            provider: 'local',
        };
    }
}
