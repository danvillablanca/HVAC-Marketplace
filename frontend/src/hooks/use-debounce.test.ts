import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@/test/render";
import { useDebounce } from "./use-debounce";

describe("hooks/use-debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("devuelve el valor inicial de inmediato", () => {
    const { result } = renderHook(() => useDebounce("a", 300));
    expect(result.current).toBe("a");
  });

  it("actualiza el valor solo después del delay", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("b");
  });

  it("reinicia el temporizador ante cambios rápidos", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: "c" });
    act(() => vi.advanceTimersByTime(200));

    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("c");
  });

  it("usa 300ms como delay por defecto", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 1 },
    });

    rerender({ value: 2 });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe(1);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(2);
  });
});
