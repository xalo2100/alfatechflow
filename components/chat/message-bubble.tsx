"use client";

import { Message } from "./types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileImage, Play, Pause } from "lucide-react";
import { useState, useRef } from "react";

interface MessageBubbleProps {
    message: Message;
    isMe: boolean;
}

export function MessageBubble({ message, isMe }: MessageBubbleProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`
                    max-w-[85%] rounded-lg p-3 shadow-sm
                    ${isMe
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 border rounded-bl-none'}
                `}
            >
                {!isMe && (
                    <div className="text-xs font-semibold mb-1 opacity-90">
                        {message.sender?.nombre_completo || "Usuario"}
                    </div>
                )}

                {message.media_type === "image" && message.media_url && (
                    <div className="mb-2">
                        <img
                            src={message.media_url}
                            alt="Imagen compartida"
                            className="rounded max-h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(message.media_url!, '_blank')}
                        />
                    </div>
                )}

                {message.media_type === "audio" && message.media_url && (
                    <div className="flex items-center gap-2 mb-1 min-w-[150px]">
                        <button
                            onClick={togglePlay}
                            className={`p-2 rounded-full ${isMe ? 'bg-blue-500 hover:bg-blue-400' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200'}`}
                        >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <div className="text-xs italic opacity-80">Nota de voz</div>
                        <audio
                            ref={audioRef}
                            src={message.media_url}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                        />
                    </div>
                )}

                {message.content && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                    </p>
                )}

                <div className="text-[10px] text-right mt-1 opacity-70">
                    {format(new Date(message.created_at), "HH:mm", { locale: es })}
                </div>
            </div>
        </div>
    );
}
