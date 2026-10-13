import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { API_BASE_URL } from "@/lib/config";
import { getCurrentUserId } from "@/lib/current-user";

type RoomLookupResponse = {
    success: boolean;
    data?: { _id: string; inviteCode?: string };
    error?: { message?: string };
};

type JoinResponse = {
    success?: boolean;
    error?: { message?: string };
};

export const Route = createFileRoute("/rooms/join/$code")({
    component: JoinRoomByCodePage,
});

function JoinRoomByCodePage() {
    const { code: rawCode } = Route.useParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function joinByCode() {
            const userId = getCurrentUserId();
            if (!userId) {
                navigate({ to: "/auth/login" });
                return;
            }

            const code = rawCode.trim().toUpperCase();
            if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
                setError("Código de convite inválido. Use o formato XXXX-XXXX.");
                return;
            }

            try {
                const lookupResponse = await fetch(
                    `${API_BASE_URL}/rooms/code/${encodeURIComponent(code)}`,
                    { credentials: "include" }
                );
                const lookup = (await lookupResponse.json()) as RoomLookupResponse;

                if (!lookupResponse.ok || !lookup.success || !lookup.data?._id) {
                    throw new Error(
                        lookup.error?.message ?? "Não foi encontrada uma sala com esse código."
                    );
                }

                const joinResponse = await fetch(
                    `${API_BASE_URL}/rooms/${lookup.data._id}/join`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ user: userId, code }),
                    }
                );
                const joinResult = (await joinResponse.json().catch(() => null)) as JoinResponse | null;

                const alreadyJoined =
                    joinResponse.status === 409 &&
                    joinResult?.error?.message === "Usuário já está na sala.";

                if (!joinResponse.ok && !alreadyJoined) {
                    throw new Error(
                        joinResult?.error?.message ?? "Não foi possível entrar na sala."
                    );
                }

                if (!cancelled) {
                    navigate({
                        to: "/rooms/$id",
                        params: { id: lookup.data._id },
                    });
                }
            } catch (cause) {
                if (!cancelled) {
                    setError(
                        cause instanceof Error
                            ? cause.message
                            : "Não foi possível entrar na sala."
                    );
                }
            }
        }

        void joinByCode();

        return () => {
            cancelled = true;
        };
    }, [rawCode, navigate]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-6">
            <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
                <h1 className="text-lg font-semibold">
                    {error ? "Não foi possível entrar" : "Entrando na sala..."}
                </h1>
                <p className="mt-2 break-words text-sm text-muted-foreground">
                    {error ?? `Validando o código ${rawCode.toUpperCase()}.`}
                </p>
                {error && (
                    <button
                        type="button"
                        onClick={() => navigate({ to: "/rooms/" })}
                        className="mt-5 h-11 bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                        Voltar para as salas
                    </button>
                )}
            </section>
        </main>
    );
}
