const authorizationStorageKey = "vista-kiosk.settings-token";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, init);
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "Falha na comunicação com o servidor");
  return body;
}

export function getConfig<T>() {
  return request<T>("/api/config");
}

export function saveConfig<T>(config: T) {
  return request<T>("/api/config", {
    method: "PUT",
    headers: authenticatedHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(config),
  });
}

export function login(password: string) {
  return request<{ token: string }>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export function saveAuthorization(token: string) {
  sessionStorage.setItem(authorizationStorageKey, token);
}

export function isAuthorized() {
  return Boolean(sessionStorage.getItem(authorizationStorageKey));
}

export function uploadMedia<T>(target: "background_media" | "logo", file: File) {
  return request<T>(`/api/config/${target}`, {
    method: "POST",
    headers: authenticatedHeaders({
      "X-Media-Type": file.type,
      "X-File-Name": file.name,
    }),
    body: file,
  });
}

export async function changePassword(password: string) {
  const response = await fetch("/api/auth/password", {
    method: "POST",
    headers: authenticatedHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? "Não foi possível alterar a senha");
  }
}

export function getTicket<T>(
  code: string,
  keyQueryFind:
    undefined | string | "" | "ignore" | "cobrar-rotativo" | "addHours" | "new-daily-rate",
  minutesToAdd: string,
) {
  /* Envia horas adicionar via query usando key addHour */
  const query = new URLSearchParams({
    [keyQueryFind ?? ""]: keyQueryFind === "addHours" ? (minutesToAdd ?? undefined) : "true",
  }).toString();
  return request<T>(`/api/tickets/${encodeURIComponent(code)}?${query}`);
}

export function extendTicket<T>(code: string, minutes: number) {
  return request<T>(`/api/tickets/${encodeURIComponent(code)}/extend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ minutes }),
  });
}

export interface PaymentStatus {
  status:
    | "loading"
    | "insert_card"
    | "enter_pin"
    | "processing"
    | "approved"
    | "declined"
    | "cancelled"
    | "error";
  message: string;
  progress?: number;
}

export function startPayment(payload: {
  amountCents: number;
  method: "debit" | "credit" | "pix";
  ticketCode?: string;
  token: string;
}) {
  return request<{ transactionId: string; status: PaymentStatus }>("/api/start-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function subscribePayment(transactionId: string, onStatus: (status: PaymentStatus) => void) {
  const source = new EventSource(`/api/payments/${encodeURIComponent(transactionId)}/events`);
  source.addEventListener("status", (event) => onStatus(JSON.parse(event.data) as PaymentStatus));
  return source;
}

function authenticatedHeaders(headers: HeadersInit) {
  const token = sessionStorage.getItem(authorizationStorageKey);
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}
