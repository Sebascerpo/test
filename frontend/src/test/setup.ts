import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll, jest } from "@jest/globals";
import { cleanup } from "@testing-library/react";
import { server } from "./server";

let fetchBeforeMsw: typeof fetch | null = null;

beforeAll(() => {
  fetchBeforeMsw = globalThis.fetch;
  server.listen({ onUnhandledRequest: "error" });

  const mswFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/")) {
      return mswFetch(new URL(input, "http://localhost/"), init);
    }
    return mswFetch(input as RequestInfo | URL, init);
  }) as typeof fetch;

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    })),
  });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  jest.restoreAllMocks();
});

afterAll(() => {
  server.close();
  if (fetchBeforeMsw) {
    globalThis.fetch = fetchBeforeMsw;
  }
});
