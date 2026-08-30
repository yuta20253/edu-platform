import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useColleagueDetail } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useColleagueDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("教員詳細を取得しteacherにセットする", async () => {
    const teacher = { id: 1, name: "山田太郎" };
    vi.mocked(apiClient.get).mockResolvedValue({ data: teacher });

    const { result } = renderHook(() => useColleagueDetail(1));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.teacher).toEqual(teacher);
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/colleagues/1");
  });

  it("取得に失敗するとerrorがtrueになりteacherはnullになる", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useColleagueDetail(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.teacher).toBeNull();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useColleagueDetail(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
