// Mantém dados mock por padrão somente no desenvolvimento local.
export const USE_MOCK_DATA =
  import.meta.env["VITE_USE_MOCK_DATA"] === "true" ||
  (import.meta.env.DEV && import.meta.env["VITE_USE_MOCK_DATA"] !== "false")

// Em produção, usa o proxy /api da Vercel para manter a sessão no mesmo domínio.
// Em desenvolvimento, permite configurar outra URL pelo .env.
export const API_BASE_URL = import.meta.env.PROD
  ? "/api"
  : import.meta.env["VITE_API_BASE_URL"]?.trim() || "/api"
