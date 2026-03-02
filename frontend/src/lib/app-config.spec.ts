import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  fetchAppConfig,
  getFallbackAppConfig,
  resetAppConfigCacheForTests,
} from "@/lib/app-config";

describe("app-config", () => {
  beforeEach(() => {
    resetAppConfigCacheForTests();
    jest.restoreAllMocks();
  });

  it("uses backend config response and caches result", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          currency: "USD",
          baseFee: 1000,
          deliveryFee: 2000,
        },
      }),
    } as Response);

    const configA = await fetchAppConfig();
    const configB = await fetchAppConfig();

    expect(configA).toEqual({
      currency: "USD",
      baseFee: 1000,
      deliveryFee: 2000,
    });
    expect(configB).toEqual(configA);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("falls back to local defaults when backend config fails", async () => {
    const fallback = getFallbackAppConfig();
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

    const config = await fetchAppConfig();
    expect(config).toEqual(fallback);
  });

  it("falls back when backend responds with non-OK status", async () => {
    const fallback = getFallbackAppConfig();
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ success: true, data: {} }),
    } as Response);

    const config = await fetchAppConfig();
    expect(config).toEqual(fallback);
  });

  it("falls back when payload shape is invalid", async () => {
    const fallback = getFallbackAppConfig();
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ success: false }),
    } as Response);

    const config = await fetchAppConfig();
    expect(config).toEqual(fallback);
  });

  it("sanitizes invalid numeric and empty currency values", async () => {
    const fallback = getFallbackAppConfig();
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          currency: "",
          baseFee: "abc",
          deliveryFee: "6000",
        },
      }),
    } as Response);

    const config = await fetchAppConfig();
    expect(config).toEqual({
      currency: fallback.currency,
      baseFee: fallback.baseFee,
      deliveryFee: 6000,
    });
  });
});
