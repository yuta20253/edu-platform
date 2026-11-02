import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { EditTask } from "./index";
import type { Task } from "./types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

vi.mock("./Presenter", () => ({
  Presenter: ({
    task,
    selectedUnitIds,
  }: {
    task: Task;
    selectedUnitIds: number[];
  }) => (
    <div data-testid="presenter">
      <span>{task.title}</span>
      <span data-testid="selected-unit-ids">{selectedUnitIds.join(",")}</span>
    </div>
  ),
}));

const TASK_URL = "/api/student/tasks/1";

const unit = (id: number) => ({
  id,
  course_id: 1,
  unit_name: `単元${id}`,
  course: { id: 1, level_number: 1, level_name: "標準" },
  started: false,
});

const task = {
  id: 1,
  goal_id: 9,
  title: "英単語100個を覚える",
  content: "単語帳1〜100",
  due_date: "2026-09-01",
  priority: "normal",
  status: "not_started",
  completed_at: "",
  units: [unit(11), unit(12)],
} as unknown as Task;

// タスクの取得の応答を差し替えられるようにし、講座一覧(useCourses)の URL には別の応答を返す
let taskResponse: () => Promise<unknown>;

// 呼び出しの引数の形(signal など)や順序には依存せず、URL だけを見る
const calledTaskUrl = () =>
  vi.mocked(apiClient.get).mock.calls.some(([url]) => url === TASK_URL);

describe("student/EditTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockReset();
    taskResponse = () => Promise.resolve({ data: task });
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.startsWith("/api/student/courses")) {
        return Promise.resolve({ data: [] });
      }
      return taskResponse() as ReturnType<typeof apiClient.get>;
    });
  });

  it("取得中はスピナーを表示し、エラーとフォームは表示しない", () => {
    taskResponse = () => new Promise(() => {});

    render(<EditTask goalId={9} taskId={1} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();
  });

  it("取得に成功すると、取得したタスクでフォームを表示する", async () => {
    render(<EditTask goalId={9} taskId={1} />);

    expect(await screen.findByTestId("presenter")).toHaveTextContent(
      "英単語100個を覚える",
    );
    expect(calledTaskUrl()).toBe(true);
  });

  it("初回の取得で、タスクの単元が選択済みとして反映される", async () => {
    render(<EditTask goalId={9} taskId={1} />);

    await waitFor(() =>
      expect(screen.getByTestId("selected-unit-ids")).toHaveTextContent(
        "11,12",
      ),
    );
  });

  it("500 で失敗すると「タスクの取得に失敗しました」を出し、再試行で再取得して表示する", async () => {
    let calls = 0;
    taskResponse = () => {
      calls += 1;
      return calls === 1
        ? Promise.reject({ response: { status: 500 } })
        : Promise.resolve({ data: task });
    };

    render(<EditTask goalId={9} taskId={1} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "タスクの取得に失敗しました",
    );
    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(await screen.findByTestId("presenter")).toHaveTextContent(
      "英単語100個を覚える",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("404 のときは「タスクが見つかりませんでした」を出す", async () => {
    taskResponse = () => Promise.reject({ response: { status: 404 } });

    render(<EditTask goalId={9} taskId={1} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "タスクが見つかりませんでした",
    );
  });

  it("レスポンスのない失敗(ネットワークエラー)では「タスクの取得に失敗しました」を出す", async () => {
    taskResponse = () => Promise.reject(new Error("Network Error"));

    render(<EditTask goalId={9} taskId={1} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "タスクの取得に失敗しました",
    );
  });

  it("401 のときは /login に遷移し、エラーは表示しない", async () => {
    taskResponse = () => Promise.reject({ response: { status: 401 } });

    render(<EditTask goalId={9} taskId={1} />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // render() は effect を流し切ってから返るため、初回描画だけを見るにはサーバー描画を使う
  it("初回描画では、エラー表示を出さずスピナーを出す", () => {
    taskResponse = () => new Promise(() => {});

    const html = renderToString(<EditTask goalId={9} taskId={1} />);

    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain('role="alert"');
  });
});
