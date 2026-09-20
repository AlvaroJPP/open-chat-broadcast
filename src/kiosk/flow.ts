/** Pure UI flow definition — no native or platform knowledge here. */

export type KioskStep = "idle" | "options" | "confirm" | "processing" | "done";

export interface ServiceOption {
  id: string;
  label: string;
  description: string;
  priceCents: number;
  needsPhoto: boolean;
}

export const SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: "ticket",
    label: "Pagar Estacionamento",
    description: "Pague seu ticket de estacionamento",
    priceCents: 1420,
    needsPhoto: false,
  },
  {
    id: "client",
    label: "Cliente",
    description: "Mensalidade | Pré-Pago | Convênio",
    priceCents: 1000,
    needsPhoto: true,
  },
  {
    id: "benefit",
    label: "Aplicar Benefício",
    description: "Receba seu Desconto aqui",
    priceCents: 1990,
    needsPhoto: false,
  },
];

export const formatPrice = (cents: number) =>
  cents === 0
    ? "Gratuito"
    : (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
