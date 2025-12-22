"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageCircle, X, Minimize2, Maximize2 } from "lucide-react";
import { ChatWindow } from "./chat-window";
import { createClient } from "@/lib/supabase/client";

interface ChatWidgetProps {
    currentUserId: string;
    currentUserName: string;
}

export function ChatWidget({ currentUserId, currentUserName }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    // Audio notification reference
    const audioRef = useRef<HTMLAudioElement | null>(null);

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            {/* Hidden audio for notifications */}
            <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

            {isOpen && (
                <div
                    className={cn(
                        "bg-background border rounded-lg shadow-xl mb-4 transition-all duration-300 overflow-hidden",
                        isMinimized ? "w-72 h-14" : "w-80 md:w-96 h-[500px]"
                    )}
                >
                    <div className="flex items-center justify-between p-3 bg-primary text-primary-foreground">
                        <div className="flex items-center gap-2 font-semibold">
                            <MessageCircle className="h-5 w-5" />
                            <span>Chat de Equipo</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-primary-foreground hover:bg-primary/80"
                                onClick={() => setIsMinimized(!isMinimized)}
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-primary-foreground hover:bg-primary/80"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <ChatWindow
                            currentUserId={currentUserId}
                            currentUserName={currentUserName}
                            onNewMessage={() => {
                                if (!isOpen) setHasUnread(true);
                                // Play sound if needed
                            }}
                        />
                    )}
                </div>
            )}

            {!isOpen && (
                <Button
                    onClick={() => {
                        setIsOpen(true);
                        setIsMinimized(false);
                        setHasUnread(false);
                    }}
                    size="lg"
                    className={cn(
                        "rounded-full shadow-lg h-14 w-14",
                        hasUnread && "animate-bounce bg-red-500 hover:bg-red-600"
                    )}
                >
                    <MessageCircle className="h-6 w-6" />
                    {hasUnread && (
                        <span className="absolute top-0 right-0 h-3 w-3 bg-white rounded-full border-2 border-red-500" />
                    )}
                </Button>
            )}
        </div>
    );
}
