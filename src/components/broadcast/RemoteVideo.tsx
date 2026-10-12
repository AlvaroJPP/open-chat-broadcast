import { useEffect, useRef, useState } from "react";

interface RemoteVideoProps {
    stream: MediaStream;
    /** 0 a 1 (volume do ÁUDIO deste stream) */
    volume?: number;
    /** silencia o áudio sem mexer no volume */
    muted?: boolean;
    /** false = não toca áudio (ex.: miniaturas) */
    audio?: boolean;
    /** true = só áudio, sem desenhar o vídeo */
    hideVideo?: boolean;
    className?: string;
}

/**
 * Reproduz um MediaStream.
 *
 *  - O <video> fica SEMPRE mudo (só imagem; assim nunca é bloqueado por
 *    autoplay e não duplica o som).
 *  - O som sai de um <audio> separado, com volume controlável.
 *  - Se o navegador bloquear o som (autoplay sem clique), aparece um botão
 *    para ativar.
 *  - `srcObject` só é atribuído quando o stream muda (atribuir a cada render
 *    reinicia o vídeo).
 */
export function RemoteVideo({
    stream,
    volume = 1,
    muted = false,
    audio = true,
    hideVideo = false,
    className = ""
}: RemoteVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [blocked, setBlocked] = useState(false);

    // vídeo: liga o stream e toca (mudo, então sempre permitido)
    useEffect(() => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        if (video.srcObject !== stream) {
            video.srcObject = stream;
        }

        const play = () => {
            void video.play().catch(() => undefined);
        };

        play();
        stream.addEventListener("addtrack", play);

        return () => {
            stream.removeEventListener("addtrack", play);
        };
    }, [stream]);

    // áudio: liga o stream e tenta tocar
    useEffect(() => {
        const element = audioRef.current;

        if (!element || !audio) {
            return;
        }

        if (element.srcObject !== stream) {
            element.srcObject = stream;
        }

        const play = () => {
            element
                .play()
                .then(() => setBlocked(false))
                .catch((error: unknown) => {
                    if (
                        error instanceof DOMException &&
                        error.name === "NotAllowedError"
                    ) {
                        setBlocked(true);
                    }
                });
        };

        play();
        stream.addEventListener("addtrack", play);

        return () => {
            stream.removeEventListener("addtrack", play);
        };
    }, [stream, audio]);

    // volume / mudo
    useEffect(() => {
        const element = audioRef.current;

        if (!element) {
            return;
        }

        element.volume = Math.min(1, Math.max(0, volume));
        element.muted = muted || volume === 0;
    }, [volume, muted, audio]);

    const handleActivate = () => {
        void audioRef.current
            ?.play()
            .then(() => setBlocked(false))
            .catch(() => undefined);
    };

    return (
        <>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={hideVideo ? "hidden" : className}
            />

            {audio && <audio ref={audioRef} autoPlay />}

            {audio && blocked && (
                <button
                    type="button"
                    onClick={handleActivate}
                    className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg"
                >
                    Toque para ativar o som
                </button>
            )}
        </>
    );
}
