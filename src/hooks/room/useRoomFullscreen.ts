import { useCallback, useEffect, useRef, useState } from "react";

export function useRoomFullscreen() {
    const fullscreenRef = useRef<HTMLDivElement | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(
                document.fullscreenElement === fullscreenRef.current,
            );
        };

        document.addEventListener(
            "fullscreenchange",
            handleFullscreenChange,
        );

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange,
            );
        };
    }, []);

    const handleToggleFullscreen = useCallback(async () => {
        try {
            if (!fullscreenRef.current) return;

            if (document.fullscreenElement) {
                await document.exitFullscreen();
                return;
            }

            await fullscreenRef.current.requestFullscreen();
        } catch (error) {
            console.error(
                "[ROOM] Não foi possível alterar o modo tela cheia:",
                error,
            );
        }
    }, []);

    return {
        fullscreenRef,
        isFullscreen,
        handleToggleFullscreen,
    };
}
