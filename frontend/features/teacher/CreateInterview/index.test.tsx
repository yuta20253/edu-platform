import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { CreateInterview } from "./index";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/components/ui/ToastProvider", () => ({
  useToast: () => ({ show: vi.fn() }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

vi.mock("./Presenter", () => ({
  Presenter: ({
    students,
    initialStudentId,
  }: {
    students: { id: number; name: string }[];
    initialStudentId?: number;
  }) => (
    <div>
      {`申請フォーム ${students.map((s) => s.name).join(",")} 初期:${initialStudentId ?? "なし"}`}
    </div>
  ),
}));

const studentsResponse = {
  data: {
    students: [{ id: 1, name: "山田太郎", name_kana: "ヤマダタロウ" }],
    meta: { current_page: 1, total_pages: 1, total_count: 1, per_page: 100 },
  },
};

describe("teacher/CreateInterview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化のmockResolvedValueOnceが次のテストに漏れないようにする
    vi.mocked(apiClient.get).mockReset();
  });

  it("生徒候補の取得中はスピナーを表示し、エラーは表示しない", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<CreateInterview />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("生徒候補を取得するとフォームに渡し、初期選択の生徒も渡す", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(studentsResponse);
    render(<CreateInterview initialStudentId={1} />);

    expect(
      await screen.findByText("申請フォーム 山田太郎 初期:1"),
    ).toBeInTheDocument();
  });

  it("取得に失敗するとエラーを表示し、再試行で再取得できる", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce(studentsResponse);
    render(<CreateInterview />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(
      await screen.findByText("申請フォーム 山田太郎 初期:なし"),
    ).toBeInTheDocument();
  });

  it("401のときは/loginに遷移し、エラーは表示しない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    render(<CreateInterview />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
