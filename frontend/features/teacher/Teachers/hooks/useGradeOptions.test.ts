import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGradeOptions } from "./useGradeOptions";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useGradeOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("open が false のときは取得せず空配列を返す", () => {
    const { result } = renderHook(() => useGradeOptions(false));
    expect(result.current).toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("open が true になると学年一覧を取得する", async () => {
    const gradeOptions = [{ id: 1, year: 1, display_name: "1年A組" }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: gradeOptions });

    const { result } = renderHook(({ open }) => useGradeOptions(open), {
      initialProps: { open: true },
    });

    await waitFor(() => expect(result.current).toEqual(gradeOptions));
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/grades");
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useGradeOptions(true));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
