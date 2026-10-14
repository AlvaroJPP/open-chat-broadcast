// Mantém dados mock por padrão somente no desenvolvimento local.
export const USE_MOCK_DATA =
  import.meta.env["VITE_USE_MOCK_DATA"] === "true" ||
  (import.meta.env.DEV && import.meta.env["VITE_USE_MOCK_DATA"] !== "false")

// A API e o WebSocket precisam usar o mesmo backend para compartilhar a sessão
// HttpOnly. Em produção, prioriza a URL configurada no Vercel; sem ela, usa
// o backend Render oficial em vez de uma rota /api que pode retornar NOT_FOUND.
const configuredApiBase = import.meta.env["VITE_API_BASE_URL"]?.trim()

export const API_BASE_URL = import.meta.env.PROD
  ? (configuredApiBase || "https://open-chat-broadcast.onrender.com/api").replace(/\/+$/, "")
  : (configuredApiBase || "/api").replace(/\/+$/, "")
