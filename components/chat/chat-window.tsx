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

"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatInput } from "./chat-input";
import { MessageBubble } from "./message-bubble";
import { Message, ChatUser } from "./types";
import { Loader2, Users, ArrowLeft, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatWindowProps {
    currentUserId: string;
    currentUserName: string;
    onNewMessage: () => void;
}

export function ChatWindow({ currentUserId, currentUserName, onNewMessage }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeChat, setActiveChat] = useState<ChatUser | null>(null); // null = General
    const [view, setView] = useState<'chat' | 'users'>('chat');
    const [users, setUsers] = useState<ChatUser[]>([]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Scroll to bottom helper
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Fetch Users
    useEffect(() => {
        const fetchUsers = async () => {
            const { data } = await supabase
                .from("perfiles")
                .select("id, nombre_completo, email")
                .neq("id", currentUserId); // Exclude self

            if (data) setUsers(data as any);
        };
        fetchUsers();
    }, [currentUserId]);

    // Fetch Messages based on active context
    const fetchMessages = async () => {
        setLoading(true);
        let query = supabase
            .from("mensajes")
            .select(`
                *,
                sender:perfiles!mensajes_sender_id_fkey(nombre_completo, email)
            `)
            .order("created_at", { ascending: true })
            .limit(50);

        if (activeChat) {
            // DM: (sender=me & receiver=them) OR (sender=them & receiver=me)
            query = query.or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${currentUserId})`);
        } else {
            // General: receiver_id IS NULL
            query = query.is("receiver_id", null);
        }

        const { data } = await query;

        if (data) {
            setMessages(data as any);
        }
        setLoading(false);
        setTimeout(scrollToBottom, 100);
    };

    useEffect(() => {
        fetchMessages();

        // Realtime subscription
        const channel = supabase
            .channel(`chat-room-${activeChat ? activeChat.id : 'general'}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "mensajes",
                },
                async (payload) => {
                    const newMessage = payload.new;

                    // Filter logic for realtime
                    let isRelevant = false;

                    if (activeChat) {
                        // DM Relevance
                        isRelevant = (newMessage.sender_id === currentUserId && newMessage.receiver_id === activeChat.id) ||
                            (newMessage.sender_id === activeChat.id && newMessage.receiver_id === currentUserId);
                    } else {
                        // General Relevance
                        isRelevant = newMessage.receiver_id === null;
                    }

                    if (isRelevant) {
                        // Fetch the full message with sender info to append
                        const { data } = await supabase
                            .from("mensajes")
                            .select(`
                                *,
                                sender:perfiles!mensajes_sender_id_fkey(nombre_completo, email)
                            `)
                            .eq("id", newMessage.id)
                            .single();

                        if (data) {
                            setMessages((prev) => [...prev, data as any]);
                            if (newMessage.sender_id !== currentUserId) {
                                onNewMessage(); // Only notify on incoming
                            }
                            setTimeout(scrollToBottom, 100);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeChat]);

    // Render User List
    if (view === 'users') {
        return (
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center p-4 border-b bg-white dark:bg-slate-950">
                    <Button variant="ghost" size="icon" onClick={() => setView('chat')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <span className="ml-2 font-semibold">Nueva Conversación</span>
                </div>
                <div className="p-4 space-y-2 overflow-y-auto">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 p-3 h-auto"
                        onClick={() => {
                            setActiveChat(null);
                            setView('chat');
                        }}
                    >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                            <div className="font-semibold">Chat General</div>
                            <div className="text-xs text-muted-foreground">Todos los usuarios</div>
                        </div>
                    </Button>

                    <div className="my-2 border-t" />

                    {users.map(user => (
                        <Button
                            key={user.id}
                            variant="ghost"
                            className="w-full justify-start gap-3 p-3 h-auto"
                            onClick={() => {
                                setActiveChat(user);
                                setView('chat');
                            }}
                        >
                            <Avatar>
                                <AvatarFallback>{user.nombre_completo?.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                                <div className="font-medium">{user.nombre_completo}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-white dark:bg-slate-950 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    {activeChat ? (
                        <>
                            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setView('users')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>{activeChat.nombre_completo?.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">{activeChat.nombre_completo}</span>
                                <span className="text-xs text-muted-foreground">Privado</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">Chat General</span>
                                <span className="text-xs text-muted-foreground">Grupo</span>
                            </div>
                        </>
                    )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setView('users')}>
                    <Users className="h-5 w-5 text-muted-foreground" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {loading ? (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                        <p>¡Hola! 👋</p>
                        <p className="text-sm">
                            {activeChat ? `Inicia la conversación con ${activeChat.nombre_completo}.` : "Envía un mensaje para comenzar la conversación."}
                        </p>
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
                <ChatInput
                    currentUserId={currentUserId}
                    receiverId={activeChat?.id}
                />
            </div>
        </div>
    );
}
