import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useCreateTeacher } from "./useCreateTeacher";
import type { CreateTeacherInput } from "../types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: vi.fn() },
}));

const validInput: CreateTeacherInput = {
  lastName: "田中",
  firstName: "太郎",
  email: "tanaka@example.com",
  password: "abc123xyz",
  gradeScope: "own_grade",
  manageOtherTeachers: false,
  gradeIds: [1],
};

describe("useCreateTeacher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("姓名を結合してAPIへ送信する", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { teacher: {} } });
    const onCreated = vi.fn();

    const { result } = renderHook(() =>
      useCreateTeacher({ schoolId: 1, onCreated }),
    );

    await act(async () => {
      await result.current.handleCreate(validInput);
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/admin/schools/1/teachers",
      {
        name: "田中 太郎",
        email: "tanaka@example.com",
        password: "abc123xyz",
        grade_scope: "own_grade",
        manage_other_teachers: false,
        grade_ids: [1],
      },
    );
  });

  it("成功時にonCreatedが呼ばれる", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { teacher: {} } });
    const onCreated = vi.fn();

    const { result } = renderHook(() =>
      useCreateTeacher({ schoolId: 1, onCreated }),
    );

    await act(async () => {
      await result.current.handleCreate(validInput);
    });

    expect(onCreated).toHaveBeenCalled();
    expect(result.current.createErrors).toEqual([]);
  });

  it("422エラー時はcreateErrorsにセットされる", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: { status: 422, data: { errors: ["メールアドレスは既に使用されています"] } },
    });
    const onCreated = vi.fn();

    const { result } = renderHook(() =>
      useCreateTeacher({ schoolId: 1, onCreated }),
    );

    await act(async () => {
      await result.current.handleCreate(validInput);
    });

    expect(result.current.createErrors).toEqual([
      "メールアドレスは既に使用されています",
    ]);
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: { status: 401 },
    });
    const onCreated = vi.fn();

    const { result } = renderHook(() =>
      useCreateTeacher({ schoolId: 1, onCreated }),
    );

    await act(async () => {
      await result.current.handleCreate(validInput);
    });

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
