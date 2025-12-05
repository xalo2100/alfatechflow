"use client";

import { useState } from 'react';
import { useNotifications } from '@/lib/hooks/use-notifications';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Bell, Volume2, VolumeX } from 'lucide-react';

interface NotificationSettingsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NotificationSettings({ open, onOpenChange }: NotificationSettingsProps) {
    const {
        permission,
        soundEnabled,
        browserNotificationsEnabled,
        requestPermission,
        toggleSound,
        toggleBrowserNotifications,
        setVolume,
    } = useNotifications();

    const [volume, setVolumeState] = useState(50);

    const handleVolumeChange = (value: number[]) => {
        const newVolume = value[0];
        setVolumeState(newVolume);
        setVolume(newVolume / 100);
    };

    const handleRequestPermission = async () => {
        const granted = await requestPermission();
        if (granted) {
            toggleBrowserNotifications(true);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Configuración de Notificaciones
                    </DialogTitle>
                    <DialogDescription>
                        Personaliza cómo quieres recibir notificaciones
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Notificaciones del Navegador */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="browser-notifications" className="text-base">
                                Notificaciones del Navegador
                            </Label>
                            <Switch
                                id="browser-notifications"
                                checked={browserNotificationsEnabled && permission === 'granted'}
                                onCheckedChange={(checked) => {
                                    if (checked && permission !== 'granted') {
                                        handleRequestPermission();
                                    } else {
                                        toggleBrowserNotifications(checked);
                                    }
                                }}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {permission === 'denied' && 'Permisos denegados. Habilítalos en la configuración del navegador.'}
                            {permission === 'default' && 'Haz clic para solicitar permisos'}
                            {permission === 'granted' && 'Recibirás notificaciones del sistema'}
                        </p>
                        {permission === 'default' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRequestPermission}
                                className="w-full"
                            >
                                Solicitar Permisos
                            </Button>
                        )}
                    </div>

                    {/* Sonidos */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="sound-notifications" className="text-base">
                                Sonidos de Notificación
                            </Label>
                            <Switch
                                id="sound-notifications"
                                checked={soundEnabled}
                                onCheckedChange={toggleSound}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Reproduce un sonido cuando llegue una notificación
                        </p>
                    </div>

                    {/* Volumen */}
                    {soundEnabled && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="volume" className="text-base">
                                    Volumen
                                </Label>
                                <span className="text-sm text-muted-foreground">{volume}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <VolumeX className="h-4 w-4 text-muted-foreground" />
                                <Slider
                                    id="volume"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={[volume]}
                                    onValueChange={handleVolumeChange}
                                    className="flex-1"
                                />
                                <Volume2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    )}

                    {/* Tipos de Notificaciones */}
                    <div className="space-y-2 border-t pt-4">
                        <h4 className="text-sm font-medium">Recibirás notificaciones para:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Nuevos tickets asignados</li>
                            <li>Cambios de estado en tickets</li>
                            <li>Nuevos reportes generados</li>
                            <li>Mensajes importantes del sistema</li>
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
