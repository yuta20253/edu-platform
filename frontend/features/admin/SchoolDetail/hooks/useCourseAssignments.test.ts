import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useCourseAssignments } from "./useCourseAssignments";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const assignment = {
  id: 1,
  assigned_at: "2026-01-01T00:00:00.000Z",
  course: {
    id: 10,
    level_number: 1,
    level_name: "基礎",
    subject: { id: 2, name: "数学" },
  },
};

describe("useCourseAssignments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("割当済みコース一覧を取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { course_assignments: [assignment] },
    });

    const { result } = renderHook(() => useCourseAssignments(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.assignments).toEqual([assignment]);
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/admin/schools/1/course_assignments",
    );
  });

  it("コースを割り当てると一覧が再取得される", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { course_assignments: [] },
    });
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { course_assignment: assignment },
    });

    const { result } = renderHook(() => useCourseAssignments(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleAssign(10);
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/admin/schools/1/course_assignments",
      { course_id: 10 },
    );
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it("割当を解除すると一覧が再取得される", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { course_assignments: [assignment] },
    });
    vi.mocked(apiClient.delete).mockResolvedValue({});

    const { result } = renderHook(() => useCourseAssignments(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleUnassign(10);
    });

    expect(apiClient.delete).toHaveBeenCalledWith(
      "/api/admin/schools/1/course_assignments/10",
    );
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useCourseAssignments(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
