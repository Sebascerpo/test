import { useEffect, useState } from "react";

export interface AppConfig {
  currency: string;
  baseFee: number;
  deliveryFee: number;
}

const FALLBACK_CONFIG: AppConfig = {
  currency: import.meta.env?.VITE_CURRENCY || "COP",
  baseFee: Number(import.meta.env?.VITE_BASE_FEE || 2500),
  deliveryFee: Number(import.meta.env?.VITE_DELIVERY_FEE || 5000),
};

const sanitizeConfig = (config: Partial<AppConfig>): AppConfig => {
  const baseFee = Number(config.baseFee);
  const deliveryFee = Number(config.deliveryFee);
  return {
    currency: config.currency || FALLBACK_CONFIG.currency,
    baseFee: Number.isFinite(baseFee) ? baseFee : FALLBACK_CONFIG.baseFee,
    deliveryFee: Number.isFinite(deliveryFee)
      ? deliveryFee
      : FALLBACK_CONFIG.deliveryFee,
  };
};

let cachedConfig: AppConfig | null = null;
let inFlightConfigRequest: Promise<AppConfig> | null = null;

export const getFallbackAppConfig = (): AppConfig => FALLBACK_CONFIG;

export const fetchAppConfig = async (): Promise<AppConfig> => {
  if (cachedConfig) return cachedConfig;
  if (inFlightConfigRequest) return inFlightConfigRequest;

  inFlightConfigRequest = (async () => {
    try {
      const response = await fetch("/api/app/config");
      if (!response.ok) return FALLBACK_CONFIG;

      const payload = await response.json().catch(() => null);
      if (!payload?.success || !payload?.data) return FALLBACK_CONFIG;

      const resolvedConfig = sanitizeConfig(payload.data);
      cachedConfig = resolvedConfig;
      return resolvedConfig;
    } catch {
      return FALLBACK_CONFIG;
    } finally {
      inFlightConfigRequest = null;
    }
  })();

  return inFlightConfigRequest;
};

export const useAppConfig = (): AppConfig => {
  const [config, setConfig] = useState<AppConfig>(getFallbackAppConfig());

  useEffect(() => {
    let mounted = true;
    void fetchAppConfig().then((resolved) => {
      if (!mounted) return;
      setConfig((previous) =>
        previous.currency === resolved.currency &&
        previous.baseFee === resolved.baseFee &&
        previous.deliveryFee === resolved.deliveryFee
          ? previous
          : resolved,
      );
    });
    return () => {
      mounted = false;
    };
  }, []);

  return config;
};

export const resetAppConfigCacheForTests = (): void => {
  cachedConfig = null;
  inFlightConfigRequest = null;
};
