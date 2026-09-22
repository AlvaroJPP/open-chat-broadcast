// Alterna entre dados mockados e o backend real.
//
// Por padrão usa mock (funciona sem backend rodando). Para consumir a API de
// verdade, defina no seu `.env`:
//   VITE_USE_MOCK_DATA=false
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== "false";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";