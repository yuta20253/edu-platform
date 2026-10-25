import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInterviewDetail } from "./hooks/useInterviewDetail";
import { InterviewDetail } from "./index";

vi.mock("./hooks/useInterviewDetail", () => ({
  useInterviewDetail: vi.fn(),
}));

vi.mock("./Presenter", () => ({
  Presenter: ({
    interview,
    refreshError,
  }: {
    interview: { student_name: string };
    refreshError: boolean;
  }) => (
    <div>
      {interview.student_name}さんの面談詳細
      {refreshError && <span>取り直しの失敗</span>}
    </div>
  ),
}));

const retry = vi.fn();
const hookResult = (
  overrides: Partial<ReturnType<typeof useInterviewDetail>> = {},
) =>
  ({
    interview: null,
    messages: [],
    error: false,
    retry,
    schedule: vi.fn(),
    complete: vi.fn(),
    cancel: vi.fn(),
    actionError: "",
    clearActionError: vi.fn(),
    sendMessage: vi.fn(),
    sendError: "",
    ...overrides,
  }) as ReturnType<typeof useInterviewDetail>;

describe("teacher/InterviewDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("指定した面談を取得する", () => {
    vi.mocked(useInterviewDetail).mockReturnValue(hookResult());
    render(<InterviewDetail interviewId={5} />);

    expect(useInterviewDetail).toHaveBeenCalledWith(5);
  });

  it("取得中はスピナーを表示し、エラーは表示しない", () => {
    vi.mocked(useInterviewDetail).mockReturnValue(hookResult());
    render(<InterviewDetail interviewId={1} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("取得に成功すると画面を表示する", () => {
    vi.mocked(useInterviewDetail).mockReturnValue(
      hookResult({
        interview: { student_name: "生徒太郎" } as ReturnType<
          typeof useInterviewDetail
        >["interview"],
      }),
    );
    render(<InterviewDetail interviewId={1} />);

    expect(screen.getByText("生徒太郎さんの面談詳細")).toBeInTheDocument();
  });

  it("取得に失敗するとエラーを表示し、再試行で取り直す", () => {
    vi.mocked(useInterviewDetail).mockReturnValue(hookResult({ error: true }));
    render(<InterviewDetail interviewId={1} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(retry).toHaveBeenCalled();
  });

  it("取得済みの面談があるときの失敗(操作の後の取り直しなど)は、画面全体をエラーにせず画面の中で知らせる", () => {
    vi.mocked(useInterviewDetail).mockReturnValue(
      hookResult({
        interview: { student_name: "生徒太郎" } as ReturnType<
          typeof useInterviewDetail
        >["interview"],
        error: true,
      }),
    );
    render(<InterviewDetail interviewId={1} />);

    expect(screen.getByText(/生徒太郎さんの面談詳細/)).toBeInTheDocument();
    expect(screen.getByText("取り直しの失敗")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
