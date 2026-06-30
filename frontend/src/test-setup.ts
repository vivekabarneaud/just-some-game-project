// Test setup (Vitest). Some modules touch browser globals at import time
// (e.g. api/client.ts reads localStorage). We run pure logic in the `node`
// environment for speed, so provide a minimal in-memory localStorage rather
// than pulling in jsdom. Extend here if other browser globals are needed.
if (typeof (globalThis as any).localStorage === "undefined") {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
}
