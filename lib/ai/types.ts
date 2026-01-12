export type AIProvider = 'gemini' | 'local';

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIRequest {
    provider: AIProvider;
    model?: string;
    messages: AIMessage[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
}

export interface AIResponse {
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
    provider: AIProvider;
}

export interface AIProviderImplementation {
    call(req: AIRequest): Promise<AIResponse>;
}
