import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDefaultValues } from "./useDefaultValues";
import { PRIORITY } from "../constants";
import type { DraftTaskType } from "@/features/CreateTaskConfirm/useFetchDraftTask";

describe("useDefaultValues", () => {
  it("draftTaskがnullのとき goalId と空のデフォルト値を返す", () => {
    const { result } = renderHook(() =>
      useDefaultValues({ draftTask: null, goalId: 5 }),
    );

    expect(result.current).toEqual({
      goal_id: 5,
      title: "",
      content: "",
      priority: PRIORITY.NORMAL,
      due_date: null,
      unit_ids: [],
    });
  });

  it("draftTaskがあるとき draftTask の値を優先してデフォルト値を組み立てる", () => {
    const draftTask: DraftTaskType = {
      id: 100,
      goal_id: 7,
      title: "英単語100個を覚える",
      content: "単語帳1〜100",
      priority: "4",
      due_date: "2026-09-01",
      units: [
        {
          id: 11,
          course_id: 1,
          unit_name: "be動詞",
          course: { id: 1, level_number: 1, level_name: "標準" },
        },
      ],
    };

    const { result } = renderHook(() =>
      useDefaultValues({ draftTask, goalId: 5 }),
    );

    expect(result.current.goal_id).toBe(7);
    expect(result.current.title).toBe("英単語100個を覚える");
    expect(result.current.content).toBe("単語帳1〜100");
    expect(result.current.priority).toBe(PRIORITY.NORMAL);
    expect(result.current.due_date).toEqual(new Date("2026-09-01"));
    expect(result.current.unit_ids).toEqual([11]);
  });

  it("draftTask.priority が数値のときはその値をそのまま優先度として使う", () => {
    const draftTask = {
      id: 100,
      goal_id: 7,
      title: "",
      content: "",
      priority: PRIORITY.HIGH,
      due_date: null,
      units: [],
    } as unknown as DraftTaskType;

    const { result } = renderHook(() =>
      useDefaultValues({ draftTask, goalId: 5 }),
    );

    expect(result.current.priority).toBe(PRIORITY.HIGH);
    expect(result.current.due_date).toBeNull();
  });
});
