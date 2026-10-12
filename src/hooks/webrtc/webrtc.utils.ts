
import type { WebRTCUser } from "./webrtc.types";

export function getUserId(
    user:
        | string
        | WebRTCUser
        | undefined
        | null
): string | null {
    if (!user) {
        return null;
    }

    if (typeof user === "string") {
        return user;
    }

    return user._id;
}

export function normalizeTargetId(
    target:
        | string
        | WebRTCUser
        | undefined
        | null
): string | null {
    return getUserId(target);
}