export type MediaType = "image" | "video";
export type ThemeMode = "dark" | "light";
export type ChevronDirection = "up" | "down" | "left" | "right";

export interface PositionedElement {
  x: number;
  y: number;
  size: number;
}

export interface ChevronConfig extends PositionedElement {
  direction: ChevronDirection;
  enabled: boolean;
}

export interface VisualConfig {
  theme: ThemeMode;
  customer_logo: PositionedElement & { src: string; fit: "contain" | "cover" };
  background_media: { type: MediaType; src: string };
  chevrons: Record<string, ChevronConfig>;
}

export const defaultVisualConfig: VisualConfig = {
  theme: "dark",
  customer_logo: { src: "", x: 50, y: 18, size: 24, fit: "contain" },
  background_media: { type: "image", src: "" },
  chevrons: {
    "chevron-leitor-facial": { x: 10, y: 45, size: 42, direction: "right", enabled: true },
    "chevron-leitor-ticket": { x: 88, y: 45, size: 42, direction: "left", enabled: true },
    "chevron-pinpad": { x: 76, y: 72, size: 42, direction: "up", enabled: true },
    "chevron-impressora": { x: 24, y: 72, size: 42, direction: "up", enabled: true },
  },
};
