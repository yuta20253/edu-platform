import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useCreateStudent } from "./useCreateStudent";
import type { CreateStudentInput } from "../types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: vi.fn() },
}));

const input: CreateStudentInput = {
  name: "山田太郎",
  name_kana: "ヤマダタロウ",
  email: "yamada@example.com",
  grade_id: 1,
  school_class_id: 10,
};

describe("useCreateStudent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handleCreateが成功すると生徒一覧へ遷移する", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({});
    const { result } = renderHook(() => useCreateStudent());

    await act(async () => {
      await result.current.handleCreate(input);
    });

    expect(apiClient.post).toHaveBeenCalledWith("/api/teacher/students", {
      user: input,
    });
    expect(pushMock).toHaveBeenCalledWith("/teacher/students");
    expect(result.current.creating).toBe(false);
  });

  it("handleCreateが失敗するとcreateErrorsをセットする", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: {
        status: 422,
        data: { errors: ["メールアドレスは既に使用されています"] },
      },
    });
    const { result } = renderHook(() => useCreateStudent());

    await act(async () => {
      await result.current.handleCreate(input);
    });

    expect(result.current.createErrors).toEqual([
      "メールアドレスは既に使用されています",
    ]);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: { status: 401 },
    });
    const { result } = renderHook(() => useCreateStudent());

    await act(async () => {
      await result.current.handleCreate(input);
    });

    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
