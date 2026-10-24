import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useStudentOptions } from "./useStudentOptions";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const studentsResponse = {
  data: {
    students: [
      { id: 1, name: "山田太郎", name_kana: "ヤマダタロウ" },
      { id: 2, name: "佐藤花子", name_kana: "サトウハナコ" },
    ],
    meta: { current_page: 1, total_pages: 1, total_count: 2, per_page: 100 },
  },
};

describe("useStudentOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("担当範囲の生徒をバックエンドの上限件数で取得し、id と名前の選択肢にする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(studentsResponse);
    const { result } = renderHook(() => useStudentOptions());

    await waitFor(() =>
      expect(result.current.data).toEqual([
        { id: 1, name: "山田太郎" },
        { id: 2, name: "佐藤花子" },
      ]),
    );
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/students", {
      params: { page: "1", per_page: "100" },
      signal: expect.any(AbortSignal),
    });
  });

  it("取得に失敗したときは error を true にする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 500 } });
    const { result } = renderHook(() => useStudentOptions());

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
