import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useStudentSearch } from "./useStudentSearch";

const routerMock = { push: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const emptyOptions = {
  grades: [],
  user_roles: [],
  students: {
    items: [],
    meta: { current_page: 1, total_pages: 1, total_count: 0, per_page: 20 },
  },
  own_grade_restriction: null,
};

describe("useStudentSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(apiClient.get).mockResolvedValue({ data: emptyOptions });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // APIモックのPromise解決に伴うstate更新をact内で終わらせるため、タイマーは非同期で進める
  const advance = (ms: number) =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });

  it("入力値はすぐ反映するが、検索は入力が止まって300ms後に最後のキーワードで1回だけ行う", async () => {
    const { result } = renderHook(() => useStudentSearch());
    await advance(0);
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleQueryChange("や");
      result.current.handleQueryChange("やま");
    });

    expect(result.current.query).toBe("やま");
    await advance(299);
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    await advance(1);
    expect(apiClient.get).toHaveBeenCalledTimes(2);
    expect(apiClient.get).toHaveBeenLastCalledWith(
      "/api/teacher/announcements/new",
      {
        params: { page: "1", keyword: "やま" },
        signal: expect.any(AbortSignal),
      },
    );
  });

  it("キーワードが変わるとページを1に戻す", async () => {
    const { result } = renderHook(() => useStudentSearch());

    act(() => {
      result.current.setPage(3);
    });
    await advance(0);
    expect(result.current.page).toBe(3);

    act(() => {
      result.current.handleQueryChange("さとう");
    });
    await advance(300);

    expect(result.current.page).toBe(1);
  });
});
