import { useState } from "react";
import { Cast, LogIn, Menu, UserPlus, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface HomeHeaderProps {
    onLogin?: () => void;
    onSignUp?: () => void;
    onGuestJoin?: () => void;
}

export function HomeHeader({ onLogin, onSignUp, onGuestJoin }: HomeHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    function runAction(action?: () => void) {
        setMobileMenuOpen(false);
        action?.();
    }

    return (
        <header className="relative z-30 flex h-16 shrink-0 items-center border-b border-border bg-card px-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Cast className="size-5" />
                </span>
                <span className="truncate text-base font-semibold text-foreground sm:text-lg">
                    Open Chat <span className="text-success">Broadcast</span>
                </span>
            </div>

            <nav aria-label="Navegação principal" className="ml-auto hidden items-center gap-2 lg:flex">
                <Button variant="ghost" onClick={() => runAction(onGuestJoin)}>
                    <Users />
                    Entrar como participante
                </Button>
                <Button variant="outline" onClick={() => runAction(onLogin)}>
                    <LogIn />
                    Entrar
                </Button>
                <Button variant="success" onClick={() => runAction(onSignUp)}>
                    <UserPlus />
                    Cadastrar
                </Button>
            </nav>

            <div className="ml-auto lg:hidden">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="home-mobile-menu"
                    onClick={() => setMobileMenuOpen((open) => !open)}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </Button>
            </div>

            {mobileMenuOpen && (
                <nav
                    id="home-mobile-menu"
                    aria-label="Navegação principal móvel"
                    className="absolute left-3 right-3 top-[calc(100%+0.5rem)] flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-lg lg:hidden"
                >
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => runAction(onGuestJoin)}
                    >
                        <Users />
                        Entrar como participante
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => runAction(onLogin)}
                    >
                        <LogIn />
                        Entrar
                    </Button>
                    <Button
                        type="button"
                        variant="success"
                        className="w-full justify-start"
                        onClick={() => runAction(onSignUp)}
                    >
                        <UserPlus />
                        Cadastrar
                    </Button>
                </nav>
            )}
        </header>
    );
}
