import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchCourseDetail } from "./useFetchCourseDetail";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useFetchCourseDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockReset();
  });

  it("courseIdが変わると、新しいコースが届くまで前のコースの内容を表示しない", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: { id: 1 } })
      .mockReturnValueOnce(new Promise(() => {}));

    const { result, rerender } = renderHook(
      ({ courseId }) => useFetchCourseDetail(courseId),
      { initialProps: { courseId: 1 } },
    );
    await waitFor(() => expect(result.current.course).toEqual({ id: 1 }));

    act(() => {
      rerender({ courseId: 2 });
    });

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
    expect(result.current.course).toBeNull();
  });
});
