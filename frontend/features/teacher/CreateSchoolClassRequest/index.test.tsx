import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { CreateSchoolClassRequest } from "./index";
import type { CreateSchoolClassRequestForm, GradeOption } from "./types";

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
    grades,
    onSubmit,
    submitError,
  }: {
    grades: GradeOption[];
    onSubmit: (data: CreateSchoolClassRequestForm) => void;
    submitError?: string;
  }) => (
    <div>
      <span>{`申請フォーム本体 ${grades.map((g) => g.display_name).join(",")}`}</span>
      <span>{submitError}</span>
      <button
        onClick={() =>
          onSubmit({ action: "creation", grade_id: 1, name: "1年F組" })
        }
      >
        送信
      </button>
    </div>
  ),
}));

const grades: GradeOption[] = [
  { id: 1, year: 1, display_name: "1年", school_classes: [] },
  { id: 2, year: 2, display_name: "2年", school_classes: [] },
];

describe("teacher/CreateSchoolClassRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化のmockResolvedValueOnceが次のテストに漏れないようにする
    vi.mocked(apiClient.get).mockReset();
  });

  it("学年・クラスの取得中はスピナーを表示し、エラーは表示しない", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<CreateSchoolClassRequest />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("学級一覧APIから学年・クラスを取得してフォームに渡す", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: grades });
    render(<CreateSchoolClassRequest />);

    expect(
      await screen.findByText("申請フォーム本体 1年,2年"),
    ).toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe(
      "/api/teacher/school-classes",
    );
  });

  it("取得に失敗するとエラーを表示し、再試行で再取得できる", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: grades });
    render(<CreateSchoolClassRequest />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(
      await screen.findByText("申請フォーム本体 1年,2年"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("401のときは/loginに遷移し、エラーは表示しない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    render(<CreateSchoolClassRequest />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("フォームを送信すると申請を作成し、失敗したらエラーをフォームに渡す", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: grades });
    vi.mocked(apiClient.post).mockRejectedValue({
      response: {
        status: 422,
        data: { errors: ["Nameを入力してください"] },
      },
    });
    render(<CreateSchoolClassRequest />);

    fireEvent.click(await screen.findByRole("button", { name: "送信" }));

    expect(
      await screen.findByText("Nameを入力してください"),
    ).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/teacher/school-class-requests",
      { action: "creation", grade_id: 1, name: "1年F組" },
    );
  });
});
