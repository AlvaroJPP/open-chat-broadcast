import { Cast } from "lucide-react";

export function WelcomeHero() {
    return (
        <div className="flex items-center gap-5">
            <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl border-2 border-success text-success">
                <Cast className="size-9" />
            </span>
            <div>
                <h1 className="text-3xl font-semibold text-foreground">
                    Bem-vindo ao <br />
                    Open Chat <span className="text-success">Broadcast</span>
                </h1>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Conecte-se, compartilhe sua tela e converse em tempo real.
                    <br />
                    Simples, direto e sem complicação.
                </p>
            </div>
        </div>
    );
}