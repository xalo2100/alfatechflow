// Servicio para reproducir sonidos de notificación
import { soundGenerator } from './sound-generator';

class NotificationSoundService {
    private sounds: Map<string, HTMLAudioElement> = new Map();
    private volume: number = 0.5;
    private enabled: boolean = true;
    private useSyntheticSounds: boolean = false;

    constructor() {
        // Intentar precargar sonidos MP3
        this.loadSound('new-ticket', '/sounds/new-ticket.mp3');
        this.loadSound('status-change', '/sounds/status-change.mp3');
        this.loadSound('success', '/sounds/success.mp3');
        this.loadSound('alert', '/sounds/alert.mp3');
    }

    private loadSound(name: string, url: string) {
        try {
            const audio = new Audio(url);
            audio.volume = this.volume;
            audio.preload = 'auto';

            // Si el archivo no se puede cargar, usar sonidos sintéticos
            audio.onerror = () => {
                console.log(`MP3 not found for ${name}, using synthetic sound`);
                this.useSyntheticSounds = true;
            };

            this.sounds.set(name, audio);
        } catch (error) {
            console.error(`Error loading sound ${name}:`, error);
            this.useSyntheticSounds = true;
        }
    }

    play(soundName: string) {
        if (!this.enabled) return;

        // Si usamos sonidos sintéticos o el sonido no se cargó
        if (this.useSyntheticSounds || !this.sounds.has(soundName)) {
            this.playSyntheticSound(soundName);
            return;
        }

        const sound = this.sounds.get(soundName);
        if (sound) {
            // Reiniciar el sonido si ya está reproduciéndose
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.error(`Error playing sound ${soundName}:`, error);
                // Fallback a sonido sintético
                this.playSyntheticSound(soundName);
            });
        }
    }

    private playSyntheticSound(soundName: string) {
        try {
            switch (soundName) {
                case 'new-ticket':
                    soundGenerator.generateNewTicketSound(this.volume);
                    break;
                case 'status-change':
                    soundGenerator.generateStatusChangeSound(this.volume);
                    break;
                case 'success':
                    soundGenerator.generateSuccessSound(this.volume);
                    break;
                case 'alert':
                    soundGenerator.generateAlertSound(this.volume);
                    break;
            }
        } catch (error) {
            console.error('Error playing synthetic sound:', error);
        }
    }

    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.sounds.forEach(sound => {
            sound.volume = this.volume;
        });
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    isEnabled() {
        return this.enabled;
    }
}

// Singleton instance
export const notificationSounds = new NotificationSoundService();
