import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useStudent } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useStudent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("生徒詳細を取得しstudentにセットする", async () => {
    const mockStudent = {
      id: 1,
      name: "山田太郎",
      name_kana: "ヤマダタロウ",
      email: "yamada@example.com",
      profile_completed: true,
      high_school: { name: "東京第一高校" },
      grade: { year: 1, display_name: "高校1年" },
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockStudent });

    const { result } = renderHook(() => useStudent(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.student).toEqual(mockStudent);
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/students/1");
  });

  it("401エラー時はログイン画面へリダイレクトし、エラー状態にはしない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    const { result } = renderHook(() => useStudent(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(false);
  });

  it("401以外のエラー時はerrorをtrueにしstudentをnullにする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useStudent(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.student).toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
