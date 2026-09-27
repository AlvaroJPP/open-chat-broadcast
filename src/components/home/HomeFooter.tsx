import { Github } from "lucide-react";

const contributors = [
    { username: "AlvaroJPP", url: "https://github.com/AlvaroJPP" },
    { username: "ysh-rael", url: "https://github.com/ysh-rael" },
];

const APP_VERSION = "v0.1.0";

export function HomeFooter() {
    return (
        <footer className="flex shrink-0 items-center gap-4 border-t border-border bg-card px-5 py-4">
            <span className="text-sm text-muted-foreground">Desenvolvido por</span>
            <div className="flex items-center gap-2">
                {contributors.map((contributor) => (
                    <a
                        key={contributor.username}
                        href={contributor.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`GitHub de ${contributor.username}`}
                        title={contributor.username}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                        <Github className="size-4" />
                    </a>
                ))}
            </div>

            <span className="ml-auto text-xs text-muted-foreground">Open Chat Broadcast&nbsp;&nbsp;{APP_VERSION}</span>
        </footer>
    );
}