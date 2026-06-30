import { VFC, useEffect, useState, useRef } from "react";
import { TextToSpeechManager, TTSSettings } from "./TextToSpeech";
import { TranslatedRegion } from "./TextTranslator";
import { logger } from "./Logger";

interface TTSRegion extends TranslatedRegion {
    isSpeaking?: boolean;
}

export const TTSTextOverlay: VFC<{
    visible: boolean;
    imageData: string;
    regions: TTSRegion[];
    ttsManager: TextToSpeechManager;
    ttsSettings: TTSSettings;
}> = ({ visible, imageData, regions, ttsManager, ttsSettings }) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [naturalDimensions, setNaturalDimensions] = useState({ width: 1280, height: 800 });
    const [speakingRegionIndex, setSpeakingRegionIndex] = useState<number | null>(null);

    const formattedImageData = imageData && imageData.startsWith('data:')
        ? imageData
        : imageData ? `data:image/png;base64,${imageData}` : "";

    const updateImageDimensions = () => {
        if (imgRef.current) {
            const rect = imgRef.current.getBoundingClientRect();
            setImageDimensions({ width: rect.width, height: rect.height });

            const natWidth = imgRef.current.naturalWidth;
            const natHeight = imgRef.current.naturalHeight;
            if (natWidth > 0 && natHeight > 0) {
                setNaturalDimensions({ width: natWidth, height: natHeight });
            }
        }
    };

    const handleRegionClick = async (index: number, text: string) => {
        logger.debug('TTSTextOverlay', `Clicked region ${index}: "${text.substring(0, 50)}..."`);
        setSpeakingRegionIndex(index);
        await ttsManager.speak(text);
        
        // Reset speaking indicator after a delay
        setTimeout(() => {
            if (!ttsManager.isSpeakingNow()) {
                setSpeakingRegionIndex(null);
            }
        }, 100);
    };

    useEffect(() => {
        window.addEventListener('resize', updateImageDimensions);
        return () => {
            window.removeEventListener('resize', updateImageDimensions);
        };
    }, []);

    function getScalingFactor() {
        const baseWidth = naturalDimensions.width;
        const baseHeight = naturalDimensions.height;

        let renderedWidth = imageDimensions.width;
        let renderedHeight = imageDimensions.height;

        if ((renderedWidth === 0 || renderedHeight === 0) && imgRef.current) {
            const rect = imgRef.current.getBoundingClientRect();
            renderedWidth = rect.width;
            renderedHeight = rect.height;
        }

        if (renderedWidth === 0 || renderedHeight === 0) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const aspectRatio = baseWidth / baseHeight;

            if (viewportWidth / viewportHeight > aspectRatio) {
                renderedHeight = viewportHeight;
                renderedWidth = viewportHeight * aspectRatio;
            } else {
                renderedWidth = viewportWidth;
                renderedHeight = viewportWidth / aspectRatio;
            }
        }

        return {
            widthFactor: renderedWidth / baseWidth,
            heightFactor: renderedHeight / baseHeight,
            generalFactor: ((renderedWidth / baseWidth) + (renderedHeight / baseHeight)) / 2
        };
    }

    return (
        <div id='tts-overlay'
             style={{
                 height: "100vh",
                 width: "100vw",
                 display: "flex",
                 justifyContent: "center",
                 alignItems: "center",
                 zIndex: 7001,
                 position: "fixed",
                 top: 0,
                 left: 0,
                 backgroundColor: "transparent",
                 opacity: visible ? 1 : 0,
                 pointerEvents: visible ? "auto" : "none",
             }}>

            {imageData && (
                <div style={{
                    position: "relative",
                    maxHeight: "100vh",
                    maxWidth: "100vw",
                }}>
                    <img
                        ref={imgRef}
                        src={formattedImageData}
                        onLoad={updateImageDimensions}
                        style={{
                            maxHeight: "calc(100vh - 2px)",
                            maxWidth: "calc(100vw - 2px)",
                            objectFit: "contain",
                            backgroundColor: "rgba(0, 0, 0, 0.15)",
                            border: "1px solid #4CAF50",
                            imageRendering: "pixelated"
                        }}
                        alt="Screenshot"
                    />

                    {/* Clickable text regions for TTS */}
                    {(() => {
                        const { widthFactor, heightFactor, generalFactor } = getScalingFactor();
                        const pad = 4;

                        return regions.map((region, index) => (
                            <div
                                key={index}
                                onClick={() => handleRegionClick(index, region.translatedText || region.text)}
                                style={{
                                    position: "absolute",
                                    left: `${Math.round(region.rect.left * widthFactor - pad)}px`,
                                    top: `${Math.round(region.rect.top * heightFactor - pad)}px`,
                                    width: `${Math.round((region.rect.right - region.rect.left) * widthFactor + pad * 2)}px`,
                                    height: `${Math.round((region.rect.bottom - region.rect.top) * heightFactor + pad * 2)}px`,
                                    cursor: "pointer",
                                    backgroundColor: speakingRegionIndex === index 
                                        ? "rgba(76, 175, 80, 0.5)" 
                                        : "rgba(33, 150, 243, 0.3)",
                                    border: speakingRegionIndex === index
                                        ? "2px solid #4CAF50"
                                        : "1px solid #2196F3",
                                    borderRadius: `${Math.round(4 * generalFactor)}px`,
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "12px",
                                    color: "#fff",
                                    fontWeight: "bold",
                                    textShadow: "0 0 4px rgba(0,0,0,0.8)",
                                }}
                            >
                                {speakingRegionIndex === index && (
                                    <span style={{
                                        animation: "pulse 0.6s infinite",
                                    }}>🔊</span>
                                )}
                            </div>
                        ));
                    })()}

                    {/* TTS Instructions */}
                    <div style={{
                        position: "absolute",
                        top: "20px",
                        right: "20px",
                        background: "rgba(0, 0, 0, 0.7)",
                        padding: '12px 16px',
                        borderRadius: '8px',
                        zIndex: 7003,
                        color: '#4CAF50',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        maxWidth: '300px',
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>📢 Text-to-Speech Mode</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Click any text region to hear it read aloud</div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};
