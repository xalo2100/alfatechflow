"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Mic, Image as ImageIcon, X, StopCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const compressImage = async (file: File): Promise<File> => {
    return file;
};


interface ChatInputProps {
    currentUserId: string;
    currentUserName: string;
    receiverId?: string | null;
}

export function ChatInput({ currentUserId, currentUserName, receiverId }: ChatInputProps) {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const supabase = createClient();

    const handleSendMessage = async () => {
        if ((!message.trim() && !selectedImage && !isRecording) || isSending) return;

        setIsSending(true);
        let mediaUrl = null;
        let mediaType = null;

        try {
            // Upload Image if present
            if (selectedImage) {
                const compressed = await compressImage(selectedImage);
                const fileName = `chat-images/${Date.now()}-${currentUserId}.jpg`;

                const { error: uploadError } = await supabase.storage
                    .from('chat-media')
                    .upload(fileName, compressed);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('chat-media')
                    .getPublicUrl(fileName);

                mediaUrl = publicUrl;
                mediaType = "image";
            }

            const { error } = await supabase.from("mensajes").insert({
                sender_id: currentUserId,
                receiver_id: receiverId || null,
                content: message.trim() || null,
                media_url: mediaUrl,
                media_type: mediaType,
                expires_at: mediaType === "image"
                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
                    : undefined // Text defaults to existing policy or null
            });

            if (error) {
                console.error("Error sending message:", error);
            } else {
                // --- PUSH NOTIFICATION START ---
                if (receiverId) {
                    fetch("/api/push/send", {
                        method: "POST",
                        body: JSON.stringify({
                            userId: receiverId,
                            title: `Mensaje de ${currentUserName}`,
                            body: mediaType === "image" ? "📷 Imagen enviada" : (message.trim() || "Tienes un nuevo mensaje"),
                            url: "/admin"
                        })
                    }).catch(err => console.error("Error triggering push:", err));
                }
                // --- PUSH NOTIFICATION END ---

                setMessage("");
                setSelectedImage(null);
            }
        } catch (error) {
            console.error("Error in handleSendMessage:", error);
        } finally {
            setIsSending(false);
        }
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const stopRecordingAndSend = async () => {
        if (!mediaRecorderRef.current || audioChunksRef.current.length === 0) return;

        setIsSending(true);
        try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const fileName = `chat-audio/${Date.now()}-${currentUserId}.webm`;

            const { error: uploadError } = await supabase.storage
                .from('chat-media')
                .upload(fileName, audioBlob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-media')
                .getPublicUrl(fileName);

            const { error } = await supabase.from("mensajes").insert({
                sender_id: currentUserId,
                receiver_id: receiverId || null,
                content: null,
                media_url: publicUrl,
                media_type: "audio",
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
            });

            if (error) {
                console.error("Error sending voice note:", error);
            } else {
                // --- PUSH NOTIFICATION START ---
                if (receiverId) {
                    fetch("/api/push/send", {
                        method: "POST",
                        body: JSON.stringify({
                            userId: receiverId,
                            title: `Nota de voz de ${currentUserName}`,
                            body: "🎤 Mensaje de audio",
                            url: "/admin"
                        })
                    }).catch(err => console.error("Error triggering push for audio:", err));
                }
                // --- PUSH NOTIFICATION END ---
            }

        } catch (error) {
            console.error("Error upload audio:", error);
        } finally {
            setIsSending(false);
            setIsRecording(false);
            setRecordingTime(0);
            if (timerRef.current) clearInterval(timerRef.current);
            // Stop all tracks
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);

            const startTime = Date.now();
            timerRef.current = setInterval(() => {
                setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("No se pudo acceder al micrófono.");
        }
    };


    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
        setRecordingTime(0);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col gap-2">
            {selectedImage && (
                <div className="relative w-fit">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-slate-200 rounded-full p-1 cursor-pointer" onClick={() => setSelectedImage(null)}>
                        <X className="h-3 w-3" />
                    </div>
                    <img
                        src={URL.createObjectURL(selectedImage)}
                        alt="Preview"
                        className="h-20 rounded-md border"
                    />
                    <span className="text-xs text-muted-foreground">Se comprimirá al enviar</span>
                </div>
            )}

            {isRecording ? (
                <div className="flex items-center gap-2 w-full bg-red-50 dark:bg-red-900/20 p-2 rounded-md transition-all animate-in fade-in">
                    <div className="animate-pulse h-3 w-3 bg-red-600 rounded-full" />
                    <span className="text-sm font-mono text-red-600 dark:text-red-400 min-w-[50px]">
                        {formatTime(recordingTime)}
                    </span>
                    <span className="text-sm text-muted-foreground flex-1">Grabando nota de voz...</span>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelRecording}
                        className="text-muted-foreground hover:text-red-600"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="default" // Changed from 'solid' to 'default' as 'solid' might not exist in standard shadcn setup 
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={stopRecordingAndSend}
                        disabled={isSending}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="flex items-end gap-2">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => {
                            if (e.target.files?.[0]) setSelectedImage(e.target.files[0]);
                        }}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                        title="Enviar Imagen"
                    >
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </Button>

                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 min-h-[40px] max-h-[120px] p-2 text-sm bg-transparent border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                        rows={1}
                    />

                    {message.trim() || selectedImage ? (
                        <Button
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={isSending}
                            className="shrink-0"
                        >
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    ) : (
                        <Button
                            size="icon"
                            variant="secondary"
                            onClick={startRecording}
                            className="shrink-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                            title="Grabar Audio"
                        >
                            <Mic className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
