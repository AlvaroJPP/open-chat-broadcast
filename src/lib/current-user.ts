const STORAGE_KEY = "currentUser";

type StoredUser = {
    _id?: string;
    id?: string;
};

export function getCurrentUserId(): string | null {
    const storedUser = localStorage.getItem(STORAGE_KEY);

    if (!storedUser) {
        return null;
    }

    try {
        const user = JSON.parse(storedUser) as StoredUser;

        return user._id ?? user.id ?? null;
    } catch (error) {
        console.error(
            "[AUTH] Não foi possível ler o usuário atual:",
            error
        );

        return null;
    }
}

export function setCurrentUserId(userId: string): void {
    const currentUser = localStorage.getItem(STORAGE_KEY);

    if (currentUser) {
        try {
            const user = JSON.parse(currentUser) as StoredUser;

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    ...user,
                    _id: userId,
                })
            );

            return;
        } catch {
            // Se o valor existente estiver inválido,
            // recria somente com o ID.
        }
    }

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            _id: userId,
        })
    );
}

export function clearCurrentUserId(): void {
    localStorage.removeItem(STORAGE_KEY);
}