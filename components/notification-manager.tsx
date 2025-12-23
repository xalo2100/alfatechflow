"use client";

import { useEffect } from "react";
import { usePushSubscription } from "@/lib/hooks/use-push-subscription";
import { useUser } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

export function NotificationManager() {
    const { user } = useUser();
    const { isSubscribed, subscribe, unsubscribe } = usePushSubscription(user?.id);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('SW registered:', reg))
                .catch(err => console.error('SW registration failed:', err));
        }
    }, []);

    if (!user) return null;

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribe();
            toast.info("Notificaciones desactivadas");
        } else {
            const sub = await subscribe();
            if (sub) {
                toast.success("¡Notificaciones activadas!");
            } else {
                toast.error("No se pudieron activar las notificaciones. Verifica los permisos de tu navegador.");
            }
        }
    };

    // We could return a floating button or just a settings toggle.
    // For now, let's keep it as an invisible manager, and we'll add the button to the header later.
    return null;
}

export function NotificationToggle() {
    const { user } = useUser();
    const { isSubscribed, subscribe, unsubscribe } = usePushSubscription(user?.id);

    if (!user) return null;

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
                if (isSubscribed) {
                    await unsubscribe();
                    toast.info("Notificaciones desactivadas");
                } else {
                    const sub = await subscribe();
                    if (sub) toast.success("Notificaciones activadas");
                }
            }}
            title={isSubscribed ? "Desactivar notificaciones" : "Activar notificaciones"}
        >
            {isSubscribed ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
        </Button>
    );
}
