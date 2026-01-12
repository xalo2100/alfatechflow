import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProviderImplementation, AIRequest, AIResponse } from "../types";
import { getGeminiApiKey } from "../../gemini";

export class GeminiProvider implements AIProviderImplementation {
    async call(req: AIRequest): Promise<AIResponse> {
        const apiKey = await getGeminiApiKey();
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = req.model || "gemini-2.0-flash";
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: req.temperature,
                maxOutputTokens: req.maxTokens,
                responseMimeType: req.jsonMode ? "application/json" : "text/plain",
            }
        });

        const prompt = this.formatMessages(req.messages);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            content: text,
            usage: {
                promptTokens: response.usageMetadata?.promptTokenCount || 0,
                completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: response.usageMetadata?.totalTokenCount || 0,
            },
            model: modelName,
            provider: 'gemini',
        };
    }

    private formatMessages(messages: any[]): string {
        return messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    }
}
