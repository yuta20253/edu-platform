import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGradeOptions } from "./useGradeOptions";
import type { GradeOption } from "../types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const grades: GradeOption[] = [
  {
    id: 1,
    year: 1,
    display_name: "1年",
    school_classes: [{ id: 10, name: "A組" }],
  },
  {
    id: 2,
    year: 2,
    display_name: "2年",
    school_classes: [{ id: 20, name: "A組" }],
  },
];

describe("useGradeOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restrictedGradeIdがnullの場合は学年と学級の一覧をすべて返す", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: grades });

    const { result } = renderHook(() => useGradeOptions(null));

    await waitFor(() => expect(result.current).toEqual(grades));
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/school-classes");
  });

  it("restrictedGradeIdが指定されている場合はその学年のみに絞る", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: grades });

    const { result } = renderHook(() => useGradeOptions(2));

    await waitFor(() => expect(result.current).toEqual([grades[1]]));
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useGradeOptions(null));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
