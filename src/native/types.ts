/**
 * Shared contract between the React UI and the C++ core.
 * This file is the single source of truth for the bridge protocol.
 * The UI must never assume anything about Windows/Linux or real hardware.
 */

export type Platform = "windows" | "linux" | "web";

export interface SystemStatus {
  platform: Platform;
  appVersion: string;
  coreVersion: string;
  kiosk: boolean;
  uptimeSeconds: number;
  devices: {
    printer: DeviceState;
    camera: DeviceState;
    cardReader: DeviceState;
    braServer: DeviceState;
  };
}

export type DeviceState = "online" | "offline" | "busy" | "error";

export interface PrintJob {
  title: string;
  lines: string[];
}

export interface PrintResult {
  jobId: string;
  copies: number;
}

export interface CaptureResult {
  imageId: string;
  width: number;
  height: number;
  /** data URL or opaque handle produced by the platform layer */
  preview: string;
}

export interface CardReadResult {
  maskedNumber: string;
  holder: string;
  brand: string;
  approved: boolean;
}

/** Modules exposed by the native layer. */
export interface NativeApi {
  system: {
    getStatus(): Promise<SystemStatus>;
    exitKiosk(): Promise<void>;
  };
  printer: {
    print(job: PrintJob): Promise<PrintResult>;
  };
  camera: {
    capture(): Promise<CaptureResult>;
  };
  cardReader: {
    read(amountCents: number): Promise<CardReadResult>;
  };
}

export interface BridgeRequest {
  module: keyof NativeApi;
  method: string;
  params?: unknown;
}

/** Injected by the C++ host through the WebView bind mechanism. */
export interface NativeBridgeHost {
  invoke(payload: string): Promise<string>;
}

declare global {
  interface Window {
    __KIOSK_BRIDGE__?: NativeBridgeHost;
  }
}
