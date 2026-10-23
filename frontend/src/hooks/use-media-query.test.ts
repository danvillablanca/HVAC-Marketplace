import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, act } from "@/test/render";
import { useMediaQuery } from "./use-media-query";

type Listener = (event: MediaQueryListEvent) => void;

function createMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches: initial,
    media: "",
    onchange: null,
    addEventListener: (_type: string, listener: Listener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: Listener) => {
      listeners.delete(listener);
    },
    addListener: (listener: Listener) => {
      listeners.add(listener);
    },
    removeListener: (listener: Listener) => {
      listeners.delete(listener);
    },
    dispatchEvent: vi.fn(),
    setMatches(next: boolean) {
      mql.matches = next;
    },
    emit() {
      listeners.forEach((listener) => listener({ matches: mql.matches } as MediaQueryListEvent));
    },
    listenerCount() {
      return listeners.size;
    },
  };
  return mql;
}

describe("hooks/use-media-query", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("devuelve true cuando la media query coincide", () => {
    const mql = createMatchMedia(true);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mql),
    );

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("devuelve false cuando la media query no coincide", () => {
    const mql = createMatchMedia(false);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mql),
    );

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("pasa la query a matchMedia", () => {
    const mql = createMatchMedia(false);
    const matchMediaMock = vi.fn(() => mql);
    vi.stubGlobal("matchMedia", matchMediaMock);

    renderHook(() => useMediaQuery("(max-width: 640px)"));
    expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 640px)");
  });

  it("reacciona al evento change de la media query", () => {
    const mql = createMatchMedia(false);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mql),
    );

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);

    act(() => {
      mql.setMatches(true);
      mql.emit();
    });

    expect(result.current).toBe(true);
  });

  it("se desuscribe al desmontar", () => {
    const mql = createMatchMedia(false);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mql),
    );

    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(mql.listenerCount()).toBe(1);

    unmount();
    expect(mql.listenerCount()).toBe(0);
  });
});
