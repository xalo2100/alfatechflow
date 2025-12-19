
export interface Message {
    id: string;
    sender_id: string;
    content: string | null;
    media_url: string | null;
    media_type: 'image' | 'audio' | null;
    created_at: string;
    sender?: {
        nombre_completo: string | null;
        email: string | null;
    };
}

export interface ChatUser {
    id: string;
    nombre_completo: string | null;
    email: string | null;
    online?: boolean; // For future presence features
}
