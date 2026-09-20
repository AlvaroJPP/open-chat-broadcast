import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { getConfig, saveConfig } from "@/services/kiosk-api";

import { defaultVisualConfig, type VisualConfig } from "./visual-config";

const VisualConfigContext = createContext<{
  config: VisualConfig;
  save: (config: VisualConfig) => Promise<VisualConfig>;
} | null>(null);

export function VisualConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(defaultVisualConfig);

  useEffect(() => {
    getConfig<VisualConfig>()
      .then((loadedConfig) => setConfig({ ...defaultVisualConfig, ...loadedConfig }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("root-light-mode", config.theme === "light");
  }, [config.theme]);

  async function save(nextConfig: VisualConfig) {
    const persisted = await saveConfig(nextConfig);
    setConfig(persisted);
    return persisted;
  }

  return (
    <VisualConfigContext.Provider value={{ config, save }}>{children}</VisualConfigContext.Provider>
  );
}

export function useVisualConfig() {
  const context = useContext(VisualConfigContext);
  if (!context)
    throw new Error("useVisualConfig deve ser utilizado dentro de VisualConfigProvider");
  return context;
}
