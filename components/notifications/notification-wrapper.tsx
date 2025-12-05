"use client";

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationSettings } from '@/components/notifications/notification-settings';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { useRealtimeNotifications } from '@/lib/hooks/use-realtime-notifications';

interface NotificationWrapperProps {
    userId: string;
    userRole: string;
    children: React.ReactNode;
}

export function NotificationWrapper({ userId, userRole, children }: NotificationWrapperProps) {
    const [showSettings, setShowSettings] = useState(false);
    const { soundEnabled, browserNotificationsEnabled, requestPermission } = useNotifications();

    // Activar notificaciones en tiempo real
    useRealtimeNotifications({ userId, userRole });

    // Solicitar permisos al cargar si no están configurados
    useEffect(() => {
        const hasAskedPermission = localStorage.getItem('notifications-permission-asked');
        if (!hasAskedPermission && 'Notification' in window && Notification.permission === 'default') {
            // Esperar 3 segundos antes de solicitar permisos
            setTimeout(() => {
                requestPermission().then(() => {
                    localStorage.setItem('notifications-permission-asked', 'true');
                });
            }, 3000);
        }
    }, [requestPermission]);

    return (
        <>
            {children}

            {/* Botón flotante de configuración de notificaciones */}
            <div className="fixed bottom-4 right-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-lg"
                    onClick={() => setShowSettings(true)}
                    title="Configurar notificaciones"
                >
                    {soundEnabled || browserNotificationsEnabled ? (
                        <Bell className="h-5 w-5" />
                    ) : (
                        <BellOff className="h-5 w-5 text-muted-foreground" />
                    )}
                </Button>
            </div>

            <NotificationSettings open={showSettings} onOpenChange={setShowSettings} />
        </>
    );
}
