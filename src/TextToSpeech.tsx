import { call } from "@decky/api";
import { logger } from "./Logger";

export interface TTSSettings {
    enabled: boolean;
    voice: string;
    pitch: number;
    rate: number;
    volume: number;
}

export class TextToSpeechManager {
    private settings: TTSSettings = {
        enabled: true,
        voice: "default",
        pitch: 1.0,
        rate: 1.0,
        volume: 1.0,
    };
    private availableVoices: string[] = [];
    private isSpeaking: boolean = false;

    constructor() {
        logger.info('TextToSpeechManager', 'TextToSpeechManager initialized');
        this.initializeVoices();
    }

    private initializeVoices(): void {
        try {
            if ('speechSynthesis' in window) {
                const synth = window.speechSynthesis;
                const voices = synth.getVoices();
                this.availableVoices = voices.map(v => v.name);
                
                if (this.availableVoices.length === 0) {
                    synth.onvoiceschanged = () => {
                        const updatedVoices = synth.getVoices();
                        this.availableVoices = updatedVoices.map(v => v.name);
                        logger.info('TextToSpeechManager', `Voices loaded: ${this.availableVoices.length} available`);
                    };
                }
                logger.info('TextToSpeechManager', `Initialized with ${this.availableVoices.length} voices`);
            }
        } catch (e) {
            logger.error('TextToSpeechManager', 'Failed to initialize voices', e);
        }
    }

    getAvailableVoices(): string[] {
        return this.availableVoices;
    }

    setSettings(settings: Partial<TTSSettings>): void {
        this.settings = { ...this.settings, ...settings };
        logger.debug('TextToSpeechManager', `Settings updated: ${JSON.stringify(this.settings)}`);
    }

    getSettings(): TTSSettings {
        return this.settings;
    }

    async speak(text: string): Promise<void> {
        if (!this.settings.enabled) {
            logger.debug('TextToSpeechManager', 'TTS is disabled');
            return;
        }

        if (!('speechSynthesis' in window)) {
            logger.error('TextToSpeechManager', 'Speech Synthesis API not available');
            return;
        }

        if (this.isSpeaking) {
            this.stop();
        }

        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = this.settings.pitch;
            utterance.rate = this.settings.rate;
            utterance.volume = this.settings.volume;

            if (this.settings.voice !== 'default') {
                const synth = window.speechSynthesis;
                const voices = synth.getVoices();
                const selectedVoice = voices.find(v => v.name === this.settings.voice);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }

            utterance.onstart = () => {
                this.isSpeaking = true;
                logger.debug('TextToSpeechManager', `Speaking: "${text.substring(0, 50)}..."`);
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                logger.debug('TextToSpeechManager', 'Speech finished');
            };

            utterance.onerror = (event) => {
                this.isSpeaking = false;
                logger.error('TextToSpeechManager', `Speech error: ${event.error}`);
            };

            window.speechSynthesis.speak(utterance);
        } catch (error) {
            logger.error('TextToSpeechManager', 'Error during TTS', error);
        }
    }

    stop(): void {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            this.isSpeaking = false;
            logger.debug('TextToSpeechManager', 'Speech stopped');
        }
    }

    isSpeakingNow(): boolean {
        return this.isSpeaking;
    }
}
