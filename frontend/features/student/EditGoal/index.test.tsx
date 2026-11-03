import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { EditGoal } from "./index";
import type { Goal } from "./types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

vi.mock("./Presenter", () => ({
  Presenter: ({ goal }: { goal: Goal }) => (
    <div data-testid="presenter">{goal.title}</div>
  ),
}));

const GOAL_URL = "/api/student/goals/1";

const goal: Goal = {
  id: 1,
  title: "英単語1000語を覚える",
  description: "毎日30分学習する",
  status: "in_progress",
  due_date: "2026-09-30",
  tasks: [],
};

// 呼び出しの引数の形(signal など)には依存せず、URL だけを見る
const calledGoalUrl = () =>
  vi.mocked(apiClient.get).mock.calls.some(([url]) => url === GOAL_URL);

describe("student/EditGoal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化の mockResolvedValueOnce が次のテストに漏れないようにする
    vi.mocked(apiClient.get).mockReset();
  });

  it("取得中はスピナーを表示し、エラーとフォームは表示しない", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    render(<EditGoal goalId={1} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();
  });

  it("取得に成功すると、取得した目標でフォームを表示する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: goal });

    render(<EditGoal goalId={1} />);

    expect(await screen.findByTestId("presenter")).toHaveTextContent(
      "英単語1000語を覚える",
    );
    expect(calledGoalUrl()).toBe(true);
  });

  it("500 で失敗すると「目標の取得に失敗しました」を出し、再試行で再取得して表示する", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: goal });

    render(<EditGoal goalId={1} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "目標の取得に失敗しました",
    );
    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(await screen.findByTestId("presenter")).toHaveTextContent(
      "英単語1000語を覚える",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("404 のときは「目標が見つかりませんでした」を出す", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 404 } });

    render(<EditGoal goalId={1} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "目標が見つかりませんでした",
    );
  });

  it("レスポンスのない失敗(ネットワークエラー)では「目標の取得に失敗しました」を出す", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("Network Error"));

    render(<EditGoal goalId={1} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "目標の取得に失敗しました",
    );
  });

  it("401 のときは /login に遷移し、エラーは表示しない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });

    render(<EditGoal goalId={1} />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // render() は effect を流し切ってから返るため、初回描画だけを見るにはサーバー描画を使う
  it("初回描画では、エラー表示を出さずスピナーを出す", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const html = renderToString(<EditGoal goalId={1} />);

    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain('role="alert"');
  });
});
