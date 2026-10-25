import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { Question } from "./index";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

vi.mock("./Presenter", () => ({
  Presenter: ({
    currentIndex,
    totalCount,
    onAnswer,
    onSkip,
  }: {
    currentIndex: number;
    totalCount: number;
    onAnswer: (choiceId: number) => void;
    onSkip: () => void;
  }) => (
    <div>
      <span>{`問題 ${currentIndex + 1}/${totalCount}`}</span>
      <button onClick={() => onAnswer(1)}>回答</button>
      <button onClick={onSkip}>スキップ</button>
    </div>
  ),
}));

const QUESTIONS = { data: [{ id: 11 }, { id: 12 }] };

const renderQuestion = () => <Question taskId={1} unitId={2} />;

describe("student/Question", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化のmockResolvedValueOnceが次のテストに漏れないようにする
    vi.mocked(apiClient.get).mockReset();
  });

  it("取得中はスピナーを表示し、エラーや空の表示は出さない", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(renderQuestion());

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("問題が存在しません")).not.toBeInTheDocument();
  });

  it("取得に成功すると最初の問題を表示する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(QUESTIONS);
    render(renderQuestion());

    expect(await screen.findByText("問題 1/2")).toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe(
      "/api/student/tasks/1/units/2/questions",
    );
  });

  it("取得後に0件のときは「問題が存在しません」を表示する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    render(renderQuestion());

    expect(await screen.findByText("問題が存在しません")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("取得に失敗するとエラーを表示し、再試行すると最初の問題から始まる", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce(QUESTIONS);
    render(renderQuestion());

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(await screen.findByText("問題 1/2")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("401のときは/loginに遷移し、エラーは表示しない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    render(renderQuestion());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("回答の送信に失敗すると、取得エラーとは別の文言を表示する", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(apiClient.get).mockResolvedValue(QUESTIONS);
    vi.mocked(apiClient.post).mockRejectedValue({ response: { status: 500 } });
    render(renderQuestion());
    await screen.findByText("問題 1/2");

    fireEvent.click(screen.getByRole("button", { name: "回答" }));

    expect(
      await screen.findByText("回答の送信に失敗しました"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    consoleError.mockRestore();
  });

  // render() は effect を流し切ってから返るため、初回描画だけを見るにはサーバー描画を使う
  it("初回描画では、「問題が存在しません」を出さずスピナーを出す", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const html = renderToString(renderQuestion());

    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain("問題が存在しません");
    expect(html).not.toContain("データの取得に失敗しました");
  });
});
