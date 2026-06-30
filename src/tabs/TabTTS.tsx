import { VFC, useState, useEffect } from "react";
import {
    PanelSection,
    PanelSectionRow,
    SliderField,
    DropdownItem,
    Dropdown,
    ToggleField,
} from "@decky/ui";
import { TextToSpeechManager, TTSSettings } from "../TextToSpeech";
import { logger } from "../Logger";

interface TabTTSProps {
    ttsManager: TextToSpeechManager;
    onSettingsChanged: (settings: TTSSettings) => void;
}

export const TabTTS: VFC<TabTTSProps> = ({ ttsManager, onSettingsChanged }) => {
    const [settings, setSettings] = useState<TTSSettings>(ttsManager.getSettings());
    const [voices, setVoices] = useState<string[]>(ttsManager.getAvailableVoices());
    const [testText] = useState("This is a test of the text to speech system.");

    useEffect(() => {
        const availableVoices = ttsManager.getAvailableVoices();
        if (availableVoices.length > 0) {
            setVoices(availableVoices);
        }
    }, [ttsManager]);

    const handleSettingChange = (key: keyof TTSSettings, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        ttsManager.setSettings(newSettings);
        onSettingsChanged(newSettings);
        logger.debug('TabTTS', `${key} changed to ${value}`);
    };

    const handleTestSpeech = async () => {
        logger.debug('TabTTS', 'Testing speech...');
        await ttsManager.speak(testText);
    };

    return (
        <>
            <PanelSection title="Text-to-Speech">
                <PanelSectionRow>
                    <ToggleField
                        label="Enable TTS"
                        description="Enable text-to-speech functionality"
                        checked={settings.enabled}
                        onChange={(enabled) => handleSettingChange('enabled', enabled)}
                    />
                </PanelSectionRow>

                {settings.enabled && (
                    <>
                        <PanelSectionRow>
                            <Dropdown
                                menuLabel="Voice"
                                rgOptions={voices.length > 0
                                    ? [
                                        { data: 'default', label: 'Default Voice' },
                                        ...voices.map(voice => ({ data: voice, label: voice }))
                                    ]
                                    : [{ data: 'default', label: 'Default (Loading...)' }]
                                }
                                selectedOption={settings.voice}
                                onChange={(e) => handleSettingChange('voice', e.data)}
                            />
                        </PanelSectionRow>

                        <PanelSectionRow>
                            <SliderField
                                label="Pitch"
                                min={0.5}
                                max={2.0}
                                step={0.1}
                                value={settings.pitch}
                                onChange={(pitch) => handleSettingChange('pitch', pitch)}
                                description="Lower = deeper voice, Higher = higher pitched voice"
                            />
                        </PanelSectionRow>

                        <PanelSectionRow>
                            <SliderField
                                label="Speed"
                                min={0.5}
                                max={2.0}
                                step={0.1}
                                value={settings.rate}
                                onChange={(rate) => handleSettingChange('rate', rate)}
                                description="Lower = slower, Higher = faster speech"
                            />
                        </PanelSectionRow>

                        <PanelSectionRow>
                            <SliderField
                                label="Volume"
                                min={0.0}
                                max={1.0}
                                step={0.1}
                                value={settings.volume}
                                onChange={(volume) => handleSettingChange('volume', volume)}
                                description="Speech volume level"
                            />
                        </PanelSectionRow>

                        <PanelSectionRow>
                            <div
                                style={{
                                    padding: '12px 16px',
                                    backgroundColor: '#1a1a1a',
                                    borderRadius: '8px',
                                    border: '1px solid #4CAF50',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    color: '#4CAF50',
                                    transition: 'all 0.3s ease',
                                }}
                                onClick={handleTestSpeech}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#4CAF50';
                                    e.currentTarget.style.color = '#000';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                                    e.currentTarget.style.color = '#4CAF50';
                                }}
                            >
                                🔊 Test Speech
                            </div>
                        </PanelSectionRow>
                    </>
                )}
            </PanelSection>

            <PanelSection title="How to Use TTS">
                <div style={{
                    padding: '12px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: '#ccc',
                }}>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>1. Enable TTS Mode</strong>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Toggle "Enable TTS" above</div>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>2. Press to Speak</strong>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Click on any text in the overlay to hear it read aloud</div>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>3. Customize Voice</strong>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Adjust pitch, speed, and volume to your preference</div>
                    </div>
                    <div>
                        <strong>4. Blue = Clickable</strong>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Green = Currently Speaking</div>
                    </div>
                </div>
            </PanelSection>
        </>
    );
};
