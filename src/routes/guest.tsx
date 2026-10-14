import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Cast, ArrowLeft, Users } from "lucide-react";
import { useState, type FormEvent } from "react";

import { API_BASE_URL } from "@/lib/config";

export const Route = createFileRoute("/guest")({
    component: GuestJoinPage,
});

type GuestJoinResponse = {
    success?: boolean;
    data?: {
        user: {
            _id: string;
            nickname: string;
            avatar?: string | null;
            isGuest: true;
        };
        room: {
            _id: string;
            name: string;
            inviteCode?: string;
        };
    };
    error?: {
        message?: string;
    };
};

function GuestJoinPage() {
    const navigate = useNavigate();
    const [code, setCode] = useState("");
    const [nickname, setNickname] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const normalizedCode = code.trim().toUpperCase();
        const normalizedNickname = nickname.trim();

        if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizedCode)) {
            setError("Digite o código da sala no formato XXXX-XXXX.");
            return;
        }

        if (normalizedNickname.length < 3 || normalizedNickname.length > 50 ||
            !/^[a-zA-Z0-9_.]+$/.test(normalizedNickname)) {
            setError("O apelido deve ter de 3 a 50 caracteres e usar apenas letras, números, ponto ou underline.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/rooms/guest-join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    code: normalizedCode,
                    nickname: normalizedNickname,
                }),
            });

            const result = await response.json().catch(() => null) as GuestJoinResponse | null;

            if (!response.ok || !result?.success || !result.data?.user?._id || !result.data.room?._id) {
                throw new Error(result?.error?.message ?? "Não foi possível entrar na sala.");
            }

            localStorage.setItem("currentUser", JSON.stringify(result.data.user));

            await navigate({
                to: "/rooms/$id",
                params: { id: result.data.room._id },
            });
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Ocorreu um erro ao entrar na sala.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
            <section className="w-full max-w-md space-y-7">
                <header className="space-y-3 text-center">
                    <div className="flex items-center justify-center gap-2.5">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <Cast className="size-5" />
                        </span>
                        <span className="text-lg font-semibold text-foreground">
                            Open Chat <span className="text-success">Broadcast</span>
                        </span>
                    </div>
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Users className="size-6" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Entrar como participante
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Não precisa criar uma conta. Informe o código da sala e escolha um apelido para participar.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
                    <div className="space-y-1.5">
                        <label htmlFor="guest-code" className="text-sm font-medium text-foreground">
                            Código da sala
                        </label>
                        <input
                            id="guest-code"
                            name="code"
                            type="text"
                            autoComplete="off"
                            autoCapitalize="characters"
                            maxLength={9}
                            required
                            autoFocus
                            value={code}
                            onChange={(event) => setCode(event.target.value.toUpperCase())}
                            placeholder="XXXX-XXXX"
                            className="w-full rounded-md border border-input bg-input/30 px-3 py-2.5 text-sm uppercase text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="guest-nickname" className="text-sm font-medium text-foreground">
                            Seu apelido
                        </label>
                        <input
                            id="guest-nickname"
                            name="nickname"
                            type="text"
                            autoComplete="nickname"
                            minLength={3}
                            maxLength={50}
                            required
                            value={nickname}
                            onChange={(event) => setNickname(event.target.value)}
                            placeholder="exemplo_123"
                            className="w-full rounded-md border border-input bg-input/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground">
                            Use de 3 a 50 caracteres: letras, números, ponto ou underline.
                        </p>
                    </div>

                    {error && (
                        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? "Entrando na sala..." : "Entrar na sala"}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    Já tem uma conta?{" "}
                    <Link to="/auth/login" className="font-medium text-accent hover:underline">
                        Fazer login
                    </Link>
                </p>
                <div className="text-center">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-4" />
                        Voltar ao início
                    </Link>
                </div>
            </section>
        </main>
    );
}
