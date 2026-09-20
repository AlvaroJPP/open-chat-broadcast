/**
 * Browser-side fallback used during `vite dev` in a normal browser
 * (no C++ host attached). Mirrors the C++ mock devices so the UI flow
 * is identical in both environments.
 */
import type {
  CaptureResult,
  CardReadResult,
  NativeApi,
  PrintResult,
  SystemStatus,
} from "./types";

const startedAt = Date.now();
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const id = (prefix: string) =>
  `${prefix}-${Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0")}`;

export const webMockApi: NativeApi = {
  system: {
    async getStatus(): Promise<SystemStatus> {
      await delay(80);
      return {
        platform: "web",
        appVersion: "0.1.0",
        coreVersion: "mock-web",
        kiosk: false,
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
        devices: { printer: "online", camera: "online", cardReader: "online" },
      };
    },
    async exitKiosk() {
      await delay(50);
    },
  },
  printer: {
    async print(): Promise<PrintResult> {
      await delay(900);
      return { jobId: id("job"), copies: 1 };
    },
  },
  camera: {
    async capture(): Promise<CaptureResult> {
      await delay(700);
      return { imageId: id("img"), width: 640, height: 480, preview: "mock://frame" };
    },
  },
  cardReader: {
    async read(): Promise<CardReadResult> {
      await delay(1400);
      return {
        maskedNumber: "**** **** **** 4321",
        holder: "CLIENTE DEMO",
        brand: "MOCKCARD",
        approved: true,
      };
    },
  },
};
