import { Cast, LogIn, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface HomeHeaderProps {
    onLogin?: () => void;
    onSignUp?: () => void;
}

export function HomeHeader({ onLogin, onSignUp }: HomeHeaderProps) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-5">
            <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Cast className="size-5" />
                </span>
                <span className="text-lg font-semibold text-foreground">
                    Open Chat <span className="text-success">Broadcast</span>
                </span>
            </div>

            <div className="ml-auto flex items-center gap-3">
                <Button variant="outline" onClick={onLogin}>
                    <LogIn className="size-4" />
                    Entrar
                </Button>
                <Button variant="success" onClick={onSignUp}>
                    <UserPlus className="size-4" />
                    Cadastrar
                </Button>
            </div>
        </header>
    );
}