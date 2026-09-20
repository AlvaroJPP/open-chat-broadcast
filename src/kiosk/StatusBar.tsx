import type { SystemStatus } from "@/native";
import { Settings } from "lucide-react";
import { background_mediaBackground } from "./VisualElements";

const stateColor: Record<string, string> = {
  online: "bg-success",
  busy: "bg-primary",
  offline: "bg-muted-foreground",
  error: "bg-destructive",
};

function Dot({ label, state }: { label: string; state: string }) {
  return (
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className={`size-2.5 rounded-full ${stateColor[state] ?? "bg-muted-foreground"}`} />
      {label}
    </span>
  );
}

export function StatusBar({
  status,
  onOpenSettings,
}: {
  status: SystemStatus | null;
  onOpenSettings?: () => void;
}) {
  return (
    <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 overflow-hidden border-t border-border/60 px-10 py-1 text-sm text-muted-foreground">
      <div className="flex flex-wrap items-center gap-6">
        <Dot label="BRA Parking" state={status?.devices.cardReader ?? "offline"} />
        <Dot label="BRA Pagamentos" state={status?.devices.cardReader ?? "offline"} />
        <Dot label="Leitor Facial" state={status?.devices.camera ?? "offline"} />
        <Dot label="Internet" state={status?.devices.camera ?? "offline"} />
      </div>

      <background_mediaBackground footer />

      <div className="flex items-center gap-6">
        <span>
          Data Hora{" "}
          <strong className="text-foreground">
            {new Date().toLocaleString().replace(",", "").slice(0, -3)}
          </strong>
        </span>
        <span>
          Versão: <strong className="text-foreground">0.0.1</strong>
        </span>

        {onOpenSettings && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
            onClick={onOpenSettings}
          >
            <Settings className="size-4" />
          </button>
        )}
      </div>
    </footer>
  );
}
