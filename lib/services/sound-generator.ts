// Generador de sonidos de notificación usando Web Audio API
// Este archivo genera sonidos sintéticos cuando no hay archivos MP3 disponibles

class SoundGenerator {
    private audioContext: AudioContext | null = null;

    private getAudioContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    // Sonido para nuevo ticket (dos tonos ascendentes)
    generateNewTicketSound(volume: number = 0.3) {
        const ctx = this.getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    }

    // Sonido para cambio de estado (tono único)
    generateStatusChangeSound(volume: number = 0.3) {
        const ctx = this.getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 440; // A4
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    }

    // Sonido de éxito (tres tonos ascendentes)
    generateSuccessSound(volume: number = 0.3) {
        const ctx = this.getAudioContext();

        const playTone = (frequency: number, startTime: number, duration: number) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(volume, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        playTone(523.25, ctx.currentTime, 0.1); // C5
        playTone(659.25, ctx.currentTime + 0.1, 0.1); // E5
        playTone(783.99, ctx.currentTime + 0.2, 0.15); // G5
    }

    // Sonido de alerta (tono de advertencia)
    generateAlertSound(volume: number = 0.3) {
        const ctx = this.getAudioContext();

        const playBeep = (startTime: number) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = 880; // A5
            oscillator.type = 'square';

            gainNode.gain.setValueAtTime(volume, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.1);
        };

        // Dos beeps
        playBeep(ctx.currentTime);
        playBeep(ctx.currentTime + 0.15);
    }
}

export const soundGenerator = new SoundGenerator();
