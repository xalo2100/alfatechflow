"use client";

import { useEffect, useState, useCallback } from 'react';
import { notificationSounds } from '@/lib/services/notification-sounds';
import { toast } from 'sonner';

export interface NotificationOptions {
    title: string;
    body: string;
    icon?: string;
    sound?: 'new-ticket' | 'status-change' | 'success' | 'alert';
    showToast?: boolean;
    showBrowserNotification?: boolean;
}

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(true);

    useEffect(() => {
        // Verificar permiso actual
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }

        // Cargar preferencias del localStorage
        const savedSoundEnabled = localStorage.getItem('notifications-sound-enabled');
        const savedBrowserEnabled = localStorage.getItem('notifications-browser-enabled');

        if (savedSoundEnabled !== null) {
            const enabled = savedSoundEnabled === 'true';
            setSoundEnabled(enabled);
            notificationSounds.setEnabled(enabled);
        }

        if (savedBrowserEnabled !== null) {
            setBrowserNotificationsEnabled(savedBrowserEnabled === 'true');
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        }
        return Notification.permission === 'granted';
    }, []);

    const notify = useCallback(async (options: NotificationOptions) => {
        const {
            title,
            body,
            icon = '/icon-192x192.png',
            sound = 'alert',
            showToast = true,
            showBrowserNotification = true,
        } = options;

        // Mostrar toast visual
        if (showToast) {
            toast(title, {
                description: body,
                duration: 5000,
            });
        }

        // Reproducir sonido
        if (soundEnabled && sound) {
            notificationSounds.play(sound);
        }

        // Mostrar notificación del navegador
        if (showBrowserNotification && browserNotificationsEnabled && permission === 'granted') {
            try {
                const notification = new Notification(title, {
                    body,
                    icon,
                    badge: icon,
                    tag: `notification-${Date.now()}`,
                    requireInteraction: false,
                });

                // Auto-cerrar después de 5 segundos
                setTimeout(() => notification.close(), 5000);

                // Hacer click en la notificación enfoca la ventana
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            } catch (error) {
                console.error('Error showing browser notification:', error);
            }
        }
    }, [permission, soundEnabled, browserNotificationsEnabled]);

    const toggleSound = useCallback((enabled: boolean) => {
        setSoundEnabled(enabled);
        notificationSounds.setEnabled(enabled);
        localStorage.setItem('notifications-sound-enabled', String(enabled));
    }, []);

    const toggleBrowserNotifications = useCallback((enabled: boolean) => {
        setBrowserNotificationsEnabled(enabled);
        localStorage.setItem('notifications-browser-enabled', String(enabled));
    }, []);

    const setVolume = useCallback((volume: number) => {
        notificationSounds.setVolume(volume);
        localStorage.setItem('notifications-volume', String(volume));
    }, []);

    return {
        permission,
        soundEnabled,
        browserNotificationsEnabled,
        requestPermission,
        notify,
        toggleSound,
        toggleBrowserNotifications,
        setVolume,
    };
}
