import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSortToggle } from "./useSortToggle";

type Sort = "name" | "created_at";

describe("useSortToggle", () => {
  it("初期値は渡した列と desc になる", () => {
    const { result } = renderHook(() => useSortToggle<Sort>("created_at"));

    expect(result.current.sort).toBe("created_at");
    expect(result.current.order).toBe("desc");
  });

  it("初期の並び順を指定できる", () => {
    const { result } = renderHook(() => useSortToggle<Sort>("name", "asc"));

    expect(result.current.order).toBe("asc");
  });

  it("同じ列を再度指定すると asc / desc がトグルする", () => {
    const { result } = renderHook(() => useSortToggle<Sort>("created_at"));

    act(() => result.current.toggleSort("created_at"));
    expect(result.current.sort).toBe("created_at");
    expect(result.current.order).toBe("asc");

    act(() => result.current.toggleSort("created_at"));
    expect(result.current.order).toBe("desc");
  });

  it("別の列を指定するとその列の asc から始まる", () => {
    const { result } = renderHook(() => useSortToggle<Sort>("created_at"));

    act(() => result.current.toggleSort("name"));

    expect(result.current.sort).toBe("name");
    expect(result.current.order).toBe("asc");
  });
});
