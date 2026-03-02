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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getFiniteNumber = (value: unknown, fallback: number): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sanitizeConfig = (config: unknown): AppConfig => {
  if (!isRecord(config)) return FALLBACK_CONFIG;

  const currency =
    typeof config.currency === "string" && config.currency.trim().length > 0
      ? config.currency
      : FALLBACK_CONFIG.currency;

  return {
    currency,
    baseFee: getFiniteNumber(config.baseFee, FALLBACK_CONFIG.baseFee),
    deliveryFee: getFiniteNumber(
      config.deliveryFee,
      FALLBACK_CONFIG.deliveryFee,
    ),
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

      const payload: unknown = await response.json().catch(() => null);
      if (!isRecord(payload) || payload.success !== true || !("data" in payload))
        return FALLBACK_CONFIG;

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
