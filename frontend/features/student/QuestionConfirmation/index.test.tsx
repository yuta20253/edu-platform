import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { QuestionConfirmation } from "./index";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

vi.mock("./Presenter", () => ({
  Presenter: () => <div>問題履歴本体</div>,
}));

const HISTORIES = { data: [{ question_id: 1 }] };

describe("student/QuestionConfirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化のmockResolvedValueOnceが次のテストに漏れないようにする
    vi.mocked(apiClient.get).mockReset();
  });

  it("取得中はスピナーを表示し、エラーや空の表示は出さない", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<QuestionConfirmation taskId={1} unitId={2} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("問題履歴がありません")).not.toBeInTheDocument();
  });

  it("取得に成功すると画面を表示し、回答済みの問題IDをparamsに付ける", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(HISTORIES);
    render(
      <QuestionConfirmation
        taskId={1}
        unitId={2}
        answeredQuestionIds={[3, 4]}
      />,
    );

    expect(await screen.findByText("問題履歴本体")).toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe(
      "/api/student/tasks/1/units/2/confirmation",
    );
    expect(vi.mocked(apiClient.get).mock.calls[0][1]).toMatchObject({
      params: { answered_question_ids: "3,4" },
    });
  });

  it("取得後に0件のときは「問題履歴がありません」を表示する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    render(<QuestionConfirmation taskId={1} unitId={2} />);

    expect(await screen.findByText("問題履歴がありません")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("取得に失敗するとエラーを表示し、再試行で再取得できる", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce(HISTORIES);
    render(<QuestionConfirmation taskId={1} unitId={2} />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(await screen.findByText("問題履歴本体")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("401のときは/loginに遷移し、エラーは表示しない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    render(<QuestionConfirmation taskId={1} unitId={2} />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // 従来のフックは配列の参照に依存し、同じ内容でも新しい配列を渡すと再取得していた(useApiQuery は値で比較する)
  it("同じ内容の配列を渡し直しても再取得しない", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(HISTORIES);
    const { rerender } = render(
      <QuestionConfirmation
        taskId={1}
        unitId={2}
        answeredQuestionIds={[3, 4]}
      />,
    );
    await screen.findByText("問題履歴本体");

    rerender(
      <QuestionConfirmation
        taskId={1}
        unitId={2}
        answeredQuestionIds={[3, 4]}
      />,
    );

    expect(await screen.findByText("問題履歴本体")).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  // render() は effect を流し切ってから返るため、初回描画だけを見るにはサーバー描画を使う
  it("初回描画では、「問題履歴がありません」を出さずスピナーを出す", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const html = renderToString(<QuestionConfirmation taskId={1} unitId={2} />);

    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain("問題履歴がありません");
    expect(html).not.toContain("データの取得に失敗しました");
  });
});
