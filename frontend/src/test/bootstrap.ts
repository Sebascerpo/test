import { TextEncoder, TextDecoder } from "node:util";
import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";
import { Blob, File } from "node:buffer";

// Required by msw/node + undici in Jest jsdom environment
if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}

if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

if (!globalThis.ReadableStream) {
  globalThis.ReadableStream =
    ReadableStream as typeof globalThis.ReadableStream;
}

if (!globalThis.TransformStream) {
  globalThis.TransformStream =
    TransformStream as typeof globalThis.TransformStream;
}

if (!globalThis.WritableStream) {
  globalThis.WritableStream = WritableStream as typeof globalThis.WritableStream;
}

if (!globalThis.Blob) {
  globalThis.Blob = Blob as typeof globalThis.Blob;
}

if (!globalThis.File) {
  globalThis.File = File as typeof globalThis.File;
}

if (!globalThis.BroadcastChannel) {
  class MockBroadcastChannel implements BroadcastChannel {
    name: string;
    onmessage: ((this: BroadcastChannel, ev: MessageEvent) => unknown) | null =
      null;
    onmessageerror:
      | ((this: BroadcastChannel, ev: MessageEvent) => unknown)
      | null = null;

    constructor(name: string) {
      this.name = name;
    }

    postMessage(): void {}

    close(): void {}

    addEventListener(): void {}

    removeEventListener(): void {}

    dispatchEvent(): boolean {
      return true;
    }
  }

  globalThis.BroadcastChannel =
    MockBroadcastChannel as typeof globalThis.BroadcastChannel;
}

// Mock de Storage en memoria
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

Object.defineProperty(window, "localStorage", {
  value: createMemoryStorage(),
});

Object.defineProperty(window, "sessionStorage", {
  value: createMemoryStorage(),
});

// requestAnimationFrame mock
globalThis.requestAnimationFrame = (cb: FrameRequestCallback) =>
  setTimeout(cb, 0);

globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
