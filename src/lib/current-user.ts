const STORAGE_KEY = "open-chat-broadcast:user-id";

export function getCurrentUserId(): string | null {
    return localStorage.getItem(STORAGE_KEY);
}

export function setCurrentUserId(userId: string): void {
    localStorage.setItem(STORAGE_KEY, userId);
}

export function clearCurrentUserId(): void {
    localStorage.removeItem(STORAGE_KEY);
}