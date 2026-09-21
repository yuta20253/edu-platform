import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useSchoolClasses } from "./useSchoolClasses";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useSchoolClasses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("学年別クラス一覧を取得しdataにセットする", async () => {
    const mockData = [
      {
        id: 1,
        year: 1,
        display_name: "高校1年",
        school_classes: [{ id: 10, name: "1組" }],
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useSchoolClasses());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/school-classes");
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useSchoolClasses());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
