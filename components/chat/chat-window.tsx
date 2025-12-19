"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatInput } from "./chat-input";
import { MessageBubble } from "./message-bubble";
import { Message } from "./types";
import { Loader2 } from "lucide-react";

interface ChatWindowProps {
    currentUserId: string;
    currentUserName: string;
    onNewMessage: () => void;
}

export function ChatWindow({ currentUserId, currentUserName, onNewMessage }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Scroll to bottom helper
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const fetchMessages = async () => {
        // Assuming 'mensajes' table exists as per schema
        const { data, error } = await supabase
            .from("mensajes")
            .select(`
            *,
            sender:perfiles!mensajes_sender_id_fkey(nombre_completo, email)
        `)
            .order("created_at", { ascending: true }) // Oldest first for chat history
            .limit(50); // Initial limit

        if (data) {
            setMessages(data as any); // Type assertion due to join
        }
        setLoading(false);
        setTimeout(scrollToBottom, 100);
    };

    useEffect(() => {
        fetchMessages();

        // Realtime subscription
        const channel = supabase
            .channel("chat-room")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "mensajes",
                },
                async (payload) => {
                    // Fetch the full message with sender info to append
                    const { data } = await supabase
                        .from("mensajes")
                        .select(`
                    *,
                    sender:perfiles!mensajes_sender_id_fkey(nombre_completo, email)
                `)
                        .eq("id", payload.new.id)
                        .single();

                    if (data) {
                        setMessages((prev) => [...prev, data as any]);
                        onNewMessage();
                        setTimeout(scrollToBottom, 100);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {loading ? (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                        <p>¡Hola! 👋</p>
                        <p className="text-sm">Envía un mensaje para comenzar la conversación.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isMe={msg.sender_id === currentUserId}
                        />
                    ))
                )}
                <div ref={scrollRef} />
            </div>

            <div className="p-3 bg-background border-t">
                <ChatInput currentUserId={currentUserId} />
            </div>
        </div>
    );
}
