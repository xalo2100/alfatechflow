import { AIProviderImplementation, AIRequest, AIResponse } from "../types";

export class ZaiProvider implements AIProviderImplementation {
    async call(req: AIRequest): Promise<AIResponse> {
        const apiKey = process.env.ZAI_API_KEY;
        if (!apiKey) throw new Error("Missing ZAI_API_KEY");

        const modelName = req.model || "glm-4-flash";

        const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: modelName,
                messages: req.messages,
                temperature: req.temperature,
                max_tokens: req.maxTokens,
                // Zhipu uses specific format for JSON if needed
            }),
        });

        const data = await response.json();
        if (data.error) throw new Error(`Z.ai Error: ${data.error.message}`);

        return {
            content: data.choices[0].message.content,
            usage: {
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0,
            },
            model: modelName,
            provider: 'zai',
        };
    }
}
