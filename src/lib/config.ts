// Toda a configuração pública do frontend vem das variáveis VITE_* do ambiente.
// VITE_USE_MOCK_DATA só ativa os mocks quando estiver explicitamente definido como "true".
export const USE_MOCK_DATA =
  import.meta.env["VITE_USE_MOCK_DATA"]?.trim().toLowerCase() === "true"

// Defina VITE_API_BASE_URL no .env local e nas variáveis de ambiente do deploy.
// Exemplos: /api (proxy local) ou https://seu-backend.example.com/api (produção).
// Sem valor configurado, fica vazio em vez de escolher silenciosamente outro backend.
export const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] ?? "")
  .trim()
  .replace(/\/+$/, "")
