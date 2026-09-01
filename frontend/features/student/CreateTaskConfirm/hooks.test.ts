import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useRegisterTask } from "./hooks";
import type { DraftTaskType } from "./useFetchDraftTask";

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: vi.fn() },
}));

describe("useRegisterTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("draftTaskのunitsをunit_idsに変換してtasksへPOSTする", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
    const draftTask: DraftTaskType = {
      id: 1,
      goal_id: 9,
      title: "英単語100個を覚える",
      content: "単語帳1〜100",
      priority: "high",
      due_date: "2026-09-01",
      units: [
        {
          id: 11,
          course_id: 1,
          unit_name: "be動詞",
          course: { id: 1, level_number: 1, level_name: "標準" },
        },
        {
          id: 12,
          course_id: 1,
          unit_name: "一般動詞",
          course: { id: 1, level_number: 1, level_name: "標準" },
        },
      ],
    };

    const { result } = renderHook(() => useRegisterTask());
    await result.current.registerTask(draftTask);

    expect(apiClient.post).toHaveBeenCalledWith("/api/student/tasks", {
      task: {
        goal_id: 9,
        title: "英単語100個を覚える",
        content: "単語帳1〜100",
        priority: "high",
        due_date: "2026-09-01",
        unit_ids: [11, 12],
      },
    });
  });
});
