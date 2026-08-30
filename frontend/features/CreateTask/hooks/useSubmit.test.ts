import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useSubmit } from "./useSubmit";
import type { CreateTaskForm } from "../types";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: vi.fn() },
}));

describe("useSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("selectedUnitIdsを含めてdraft-tasksを作成し、確認画面へ遷移する", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: "42" });

    const { result } = renderHook(() =>
      useSubmit({ selectedUnitIds: [1, 2] }),
    );

    const formData: CreateTaskForm = {
      goal_id: 9,
      title: "英単語100個を覚える",
      content: "単語帳1〜100",
      priority: 3,
      due_date: new Date("2026-09-01"),
      unit_ids: [],
    };

    await result.current.onSubmit(formData);

    expect(apiClient.post).toHaveBeenCalledWith("/api/student/draft-tasks", {
      draft_task: { ...formData, unit_ids: [1, 2] },
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/goals/9/tasks/confirm?draft_task_id=42",
    );
  });
});
