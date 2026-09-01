import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useUpdateTeacher } from "./useUpdateTeacher";
import type { UpdateTeacherInput } from "../types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { patch: vi.fn() },
}));

const validInput: UpdateTeacherInput = {
  lastName: "田中",
  firstName: "花子",
  email: "hanako@example.com",
  gradeScope: "all_grades",
  manageOtherTeachers: true,
  gradeIds: [1, 2],
};

describe("useUpdateTeacher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("姓名を結合してPATCHで送信する", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { teacher: {} } });
    const onUpdated = vi.fn();

    const { result } = renderHook(() =>
      useUpdateTeacher({ schoolId: 1, teacherId: 5, onUpdated }),
    );

    await act(async () => {
      await result.current.handleUpdate(validInput);
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      "/api/admin/schools/1/teachers/5",
      {
        name: "田中 花子",
        email: "hanako@example.com",
        grade_scope: "all_grades",
        manage_other_teachers: true,
        grade_ids: [1, 2],
      },
    );
  });

  it("成功時にonUpdatedが呼ばれる", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { teacher: {} } });
    const onUpdated = vi.fn();

    const { result } = renderHook(() =>
      useUpdateTeacher({ schoolId: 1, teacherId: 5, onUpdated }),
    );

    await act(async () => {
      await result.current.handleUpdate(validInput);
    });

    expect(onUpdated).toHaveBeenCalled();
  });

  it("422エラー時はupdateErrorsにセットされる", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue({
      response: {
        status: 422,
        data: { errors: ["メールアドレスは既に使用されています"] },
      },
    });
    const onUpdated = vi.fn();

    const { result } = renderHook(() =>
      useUpdateTeacher({ schoolId: 1, teacherId: 5, onUpdated }),
    );

    await act(async () => {
      await result.current.handleUpdate(validInput);
    });

    expect(result.current.updateErrors).toEqual([
      "メールアドレスは既に使用されています",
    ]);
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue({
      response: { status: 401 },
    });
    const onUpdated = vi.fn();

    const { result } = renderHook(() =>
      useUpdateTeacher({ schoolId: 1, teacherId: 5, onUpdated }),
    );

    await act(async () => {
      await result.current.handleUpdate(validInput);
    });

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
