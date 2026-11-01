// hooks/use-toast: the toast store (reducer, toast() and the useToast hook).
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { reducer, toast, useToast } from "@/hooks/use-toast";

type State = Parameters<typeof reducer>[0];
const make = (id: string, open = true) => ({ id, open, title: `toast ${id}` });

afterEach(() => {
  // Empty the shared store between tests: dismiss everything and let the removal delay pass
  vi.useFakeTimers();
  const { result } = renderHook(() => useToast());
  act(() => result.current.dismiss());
  act(() => {
    vi.runAllTimers();
  });
  vi.useRealTimers();
});

describe("toast reducer", () => {
  it("adds the newest toast first and keeps at most one", () => {
    let state: State = { toasts: [] };
    state = reducer(state, { type: "ADD_TOAST", toast: make("1") });
    state = reducer(state, { type: "ADD_TOAST", toast: make("2") });
    expect(state.toasts.map((t) => t.id)).toEqual(["2"]);
  });

  it("updates only the matching toast", () => {
    const state: State = { toasts: [make("1"), make("2")] };
    const next = reducer(state, { type: "UPDATE_TOAST", toast: { id: "2", title: "changed" } });
    expect(next.toasts).toEqual([make("1"), { ...make("2"), title: "changed" }]);
  });

  it("closes one toast, or all of them, when dismissed", () => {
    vi.useFakeTimers();
    const state: State = { toasts: [make("a"), make("b")] };
    expect(reducer(state, { type: "DISMISS_TOAST", toastId: "a" }).toasts.map((t) => t.open)).toEqual([false, true]);
    expect(reducer(state, { type: "DISMISS_TOAST" }).toasts.map((t) => t.open)).toEqual([false, false]);
  });

  it("removes one toast, or all of them", () => {
    const state: State = { toasts: [make("a"), make("b")] };
    expect(reducer(state, { type: "REMOVE_TOAST", toastId: "a" }).toasts.map((t) => t.id)).toEqual(["b"]);
    expect(reducer(state, { type: "REMOVE_TOAST" }).toasts).toEqual([]);
  });
});

describe("useToast", () => {
  it("shows a toast, updates it, and removes it a while after it is dismissed", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast());
    let handle!: ReturnType<typeof toast>;
    act(() => {
      handle = result.current.toast({ title: "Saved" });
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({ id: handle.id, title: "Saved", open: true });

    act(() => handle.update({ id: handle.id, title: "Saved again" }));
    expect(result.current.toasts[0].title).toBe("Saved again");

    // Closing it through the component's onOpenChange dismisses it
    act(() => result.current.toasts[0].onOpenChange?.(false));
    expect(result.current.toasts[0].open).toBe(false);
    // Dismissing twice schedules one removal
    act(() => handle.dismiss());
    expect(vi.getTimerCount()).toBe(1);
    act(() => {
      vi.advanceTimersByTime(1_000_000);
    });
    expect(result.current.toasts).toEqual([]);
  });

  it("keeps a toast open when onOpenChange reports it opened, and gives each toast a new id", () => {
    const { result } = renderHook(() => useToast());
    let first!: ReturnType<typeof toast>;
    let second!: ReturnType<typeof toast>;
    act(() => {
      first = toast({ title: "one" });
      second = toast({ title: "two" });
    });
    expect(second.id).not.toBe(first.id);
    act(() => result.current.toasts[0].onOpenChange?.(true));
    expect(result.current.toasts[0]).toMatchObject({ id: second.id, open: true });
  });
});
