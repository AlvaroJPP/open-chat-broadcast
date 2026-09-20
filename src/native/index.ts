/**
 * Native API facade.
 *
 * The UI only imports `native` from here. At runtime it resolves to either:
 *  - the C++ host bridge (window.__KIOSK_BRIDGE__), injected by the WebView, or
 *  - the browser mock (development in a normal browser / SSR safety).
 */
import { webMockApi } from "./mock";
import type { NativeApi, BridgeRequest } from "./types";

export * from "./types";

function hasHost(): boolean {
  return typeof window !== "undefined" && !!window.__KIOSK_BRIDGE__;
}

async function call<T>(request: BridgeRequest): Promise<T> {
  const host = typeof window !== "undefined" ? window.__KIOSK_BRIDGE__ : undefined;
  if (!host) throw new Error("native host unavailable");
  const raw = await host.invoke(JSON.stringify(request));
  const response = JSON.parse(raw) as { ok: boolean; data?: T; error?: string };
  if (!response.ok) throw new Error(response.error ?? "native call failed");
  return response.data as T;
}

const hostApi: NativeApi = {
  system: {
    getStatus: () => call({ module: "system", method: "getStatus" }),
    exitKiosk: () => call({ module: "system", method: "exitKiosk" }),
  },
  printer: {
    print: (job) => call({ module: "printer", method: "print", params: job }),
  },
  camera: {
    capture: () => call({ module: "camera", method: "capture" }),
  },
  cardReader: {
    read: (amountCents) => call({ module: "cardReader", method: "read", params: { amountCents } }),
  },
};

function proxy<M extends keyof NativeApi>(module: M): NativeApi[M] {
  return new Proxy({} as NativeApi[M], {
    get(_target, method: string) {
      return (...args: unknown[]) => {
        const impl = (hasHost() ? hostApi : webMockApi)[module] as unknown as Record<
          string,
          ((...a: unknown[]) => unknown) | undefined
        >;
        const fn = impl[method];
        if (!fn) throw new Error(`unknown native method ${String(module)}.${method}`);
        return fn(...args);
      };
    },
  });
}

export const native: NativeApi = {
  system: proxy("system"),
  printer: proxy("printer"),
  camera: proxy("camera"),
  cardReader: proxy("cardReader"),
};

export const isNativeHost = hasHost;
