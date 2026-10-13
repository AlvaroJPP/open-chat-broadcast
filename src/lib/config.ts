// Mantém dados mock por padrão somente no desenvolvimento local.
// Em produção (Vercel), usa a API real, salvo se configurado explicitamente.
export const USE_MOCK_DATA =
  import.meta.env["VITE_USE_MOCK_DATA"] === "true" ||
  (import.meta.env.DEV && import.meta.env["VITE_USE_MOCK_DATA"] !== "false")

export const API_BASE_URL =
  import.meta.env["VITE_API_BASE_URL"]?.trim() || "/api"
