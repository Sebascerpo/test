import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

const createMemoryStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

const localStorageMock = createMemoryStorage();
const sessionStorageMock = createMemoryStorage();

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  self: dom.window,
  navigator: dom.window.navigator,
  Event: dom.window.Event,
  CustomEvent: dom.window.CustomEvent,
  Element: dom.window.Element,
  HTMLElement: dom.window.HTMLElement,
  SVGElement: dom.window.SVGElement,
  Node: dom.window.Node,
  localStorage: localStorageMock,
  sessionStorage: sessionStorageMock,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(cb, 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
});

if (typeof globalThis.fetch === "function") {
  globalThis.fetch = globalThis.fetch.bind(globalThis);
}
