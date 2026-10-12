
import type {
    QualityConfig,
    StreamQuality
} from "./webrtc.types";

/*
 * Bitrate definido em bits por segundo.
 */
export const STREAM_QUALITY_CONFIG: Record<
    Exclude<StreamQuality, "auto">,
    QualityConfig
> = {
    "360p": {
        width: 640,
        height: 360,
        frameRate: 24,
        maxBitrate: 800_000
    },

    "720p": {
        width: 1280,
        height: 720,
        frameRate: 30,
        maxBitrate: 2_500_000
    },

    "1080p": {
        width: 1920,
        height: 1080,
        frameRate: 30,
        maxBitrate: 5_000_000
    },

    "1080p60": {
        width: 1920,
        height: 1080,
        frameRate: 60,
        maxBitrate: 8_000_000
    }
};

export function getRtcConfiguration(): RTCConfiguration {
    const iceServers: RTCIceServer[] = [
        {
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302"
            ]
        }
    ];

    const rawServers =
        import.meta.env["VITE_TURN_SERVERS"]?.trim();

    let parsedTurnServers: string[] = [];

    if (rawServers) {
        try {
            const parsed: unknown = JSON.parse(rawServers);

            if (Array.isArray(parsed)) {
                parsedTurnServers = parsed.filter(
                    (value): value is string =>
                        typeof value === "string" &&
                        Boolean(value.trim())
                ).map((value) => value.trim());
            } else if (
                typeof parsed === "string" &&
                parsed.trim()
            ) {
                parsedTurnServers = [parsed.trim()];
            }
        } catch (error) {
            console.warn(
                "[WebRTC] VITE_TURN_SERVERS inválido; ignorando.",
                error
            );
        }
    }

    const turnUrl =
        import.meta.env["VITE_TURN_URL"]?.trim();

    const turnUsername =
        import.meta.env["VITE_TURN_USERNAME"]?.trim();

    const turnCredential =
        import.meta.env["VITE_TURN_CREDENTIAL"]?.trim();

    const turnUrls = [
        ...parsedTurnServers,
        ...(turnUrl ? [turnUrl] : [])
    ].filter(
        (value, index, list) =>
            value &&
            list.indexOf(value) === index
    );

    for (const url of turnUrls) {
        iceServers.push({
            urls: url,
            username: turnUsername || "",
            credential: turnCredential || ""
        });
    }

    return {
        iceServers,
        iceTransportPolicy: "all",
        bundlePolicy: "max-bundle"
    };
}