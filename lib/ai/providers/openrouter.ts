import { AIProviderImplementation, AIRequest, AIResponse } from "../types";

export class OpenRouterProvider implements AIProviderImplementation {
    async call(req: AIRequest): Promise<AIResponse> {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

        const modelName = req.model || "xiaomi/mimo-v2-flash:free";

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://alfapack.cl", // Optional but good practice
                "X-Title": "AlfaTechFlow",
            },
            body: JSON.stringify({
                model: modelName,
                messages: req.messages,
                temperature: req.temperature,
                max_tokens: req.maxTokens,
                response_format: req.jsonMode ? { type: "json_object" } : undefined,
            }),
        });

        const data = await response.json();
        if (data.error) throw new Error(`OpenRouter Error: ${data.error.message}`);

        return {
            content: data.choices[0].message.content,
            usage: {
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0,
            },
            model: modelName,
            provider: req.provider,
        };
    }
}
