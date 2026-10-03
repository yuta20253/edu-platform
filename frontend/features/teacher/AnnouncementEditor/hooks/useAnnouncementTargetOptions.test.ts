import { act, renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useAnnouncementTargetOptions } from "./useAnnouncementTargetOptions";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useAnnouncementTargetOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keyword が空のときは keyword パラメータなしで取得する", async () => {
    const mockData = {
      grades: [],
      user_roles: [],
      students: {
        items: [],
        meta: { current_page: 1, total_pages: 1, total_count: 0, per_page: 20 },
      },
      own_grade_restriction: null,
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useAnnouncementTargetOptions("", 1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/teacher/announcements/new",
      { params: { page: "1" }, signal: expect.any(AbortSignal) },
    );
  });

  it("keyword をパラメータに付与して取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        grades: [],
        user_roles: [],
        students: {
          items: [],
          meta: {
            current_page: 1,
            total_pages: 1,
            total_count: 0,
            per_page: 20,
          },
        },
        own_grade_restriction: null,
      },
    });

    renderHook(() => useAnnouncementTargetOptions("yamada", 1));

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/teacher/announcements/new",
        {
          params: { page: "1", keyword: "yamada" },
          signal: expect.any(AbortSignal),
        },
      ),
    );
  });

  it("keyword が変わると再取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        grades: [],
        user_roles: [],
        students: {
          items: [],
          meta: {
            current_page: 1,
            total_pages: 1,
            total_count: 0,
            per_page: 20,
          },
        },
        own_grade_restriction: null,
      },
    });

    const { rerender } = renderHook(
      ({ keyword }) => useAnnouncementTargetOptions(keyword, 1),
      { initialProps: { keyword: "" } },
    );

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));

    act(() => {
      rerender({ keyword: "sato" });
    });

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/teacher/announcements/new",
        {
          params: { page: "1", keyword: "sato" },
          signal: expect.any(AbortSignal),
        },
      ),
    );
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useAnnouncementTargetOptions("", 1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("リクエストがキャンセルされた場合はエラー扱いしない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new axios.CanceledError());

    const { result } = renderHook(() => useAnnouncementTargetOptions("", 1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(pushMock).not.toHaveBeenCalled();
  });
});
