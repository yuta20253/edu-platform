import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useUnitSelection } from "./useUnitSelection";

describe("useUnitSelection", () => {
  it("引数を省略すると、何も選択されていない状態から始まる", () => {
    const { result } = renderHook(() => useUnitSelection());

    expect(result.current.selectedUnitIds).toEqual([]);
  });

  it("initialIds を渡すと、その単元が選択された状態から始まる", () => {
    const { result } = renderHook(() => useUnitSelection([11, 12]));

    expect(result.current.selectedUnitIds).toEqual([11, 12]);
  });

  it("handleToggleUnit で、選択を追加・解除できる", () => {
    const { result } = renderHook(() => useUnitSelection([11]));

    act(() => result.current.handleToggleUnit(12));
    expect(result.current.selectedUnitIds).toEqual([11, 12]);

    act(() => result.current.handleToggleUnit(11));
    expect(result.current.selectedUnitIds).toEqual([12]);
  });
});
