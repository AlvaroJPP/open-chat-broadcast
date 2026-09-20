import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";

import { useVisualConfig } from "./VisualContext";
import type { ChevronDirection, PositionedElement, VisualConfig } from "./visual-config";

const chevronIcons = { up: ChevronUp, down: ChevronDown, left: ChevronLeft, right: ChevronRight };

function elementStyle(element: PositionedElement) {
  return {
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.size}%`,
    transform: "translate(-50%, -50%)",
  };
}

export function customer_logo({
  className = "",
  customer_logo: configuredLogo,
}: {
  className?: string;
  customer_logo?: VisualConfig["customer_logo"];
}) {
  const { config } = useVisualConfig();
  const customer_logo = configuredLogo ?? config.customer_logo;
  return (
    <div className={`absolute z-10 text-center ${className}`} style={elementStyle(customer_logo)}>
      {customer_logo.src ? (
        <img
          src={customer_logo.src}
          alt="Logo do cliente"
          className={`h-auto w-full object-${customer_logo.fit}`}
        />
      ) : (
        <span className="font-display text-3xl font-bold tracking-[0.12em] text-foreground">
          LOGO CLI AQUI
        </span>
      )}
    </div>
  );
}

export function BraParkingLogo({ className = "" }: { className?: string }) {
  return (
    <div>
      <img
        src="/images/logo-bra.png"
        alt="Logo da BRA Parking"
        width={120}
        height={20}
        className="ml-2 inline-block"
      />
    </div>
  );
}

export function background_mediaBackground({ footer = false }: { footer?: boolean }) {
  const { config } = useVisualConfig();
  const { background_media } = config;
  if (!background_media.src) return null;
  const mediaClass = footer ? "kiosk-background_media-footer" : "kiosk-background_media";
  return background_media.type === "video" ? (
    <video className={mediaClass} src={background_media.src} autoPlay muted loop playsInline />
  ) : (
    <img className={mediaClass} src={background_media.src} alt="Publicidade" />
  );
}

export function ConfigurableChevron({ id }: { id: string }) {
  const { config } = useVisualConfig();
  const chevron = config.chevrons[id];
  if (!chevron?.enabled) return null;
  const Icon = chevronIcons[chevron.direction as ChevronDirection];
  return (
    <div
      aria-hidden="true"
      className={`kiosk-chevron kiosk-chevron--${chevron.direction} pointer-events-none absolute z-10 text-primary`}
      style={{
        left: `${chevron.x}%`,
        top: `${chevron.y}%`,
      }}
    >
      {[0, 1, 2].map((index) => (
        <Icon
          key={index}
          className="kiosk-chevron__icon"
          style={{
            width: `${chevron.size}px`,
            height: `${chevron.size}px`,
            margin: `${Math.round(chevron.size * -0.3)}px`,
            animationDelay: `${index * 160}ms`,
          }}
        />
      ))}
    </div>
  );
}
