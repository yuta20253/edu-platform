import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateTaskConfirm } from "./index";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

import { apiClient } from "@/libs/http/apiClient";

const mockGoal = {
  title: "英語の基礎を固める",
  description: "文法を復習する",
  due_date: "2026-12-01",
};

const mockDraftTask = {
  id: 1,
  goal_id: 9,
  title: "英単語100個を覚える",
  content: "単語帳1〜100",
  priority: "high",
  due_date: "2026-09-01",
  units: [
    {
      id: 11,
      course_id: 1,
      unit_name: "be動詞",
      course: { id: 1, level_number: 1, level_name: "標準" },
    },
  ],
};

describe("CreateTaskConfirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/goals/")) {
        return Promise.resolve({ data: mockGoal });
      }
      return Promise.resolve({ data: mockDraftTask });
    });
  });

  it("目標内容とタスク内容が表示される", async () => {
    render(<CreateTaskConfirm goalId={9} draftTaskId={1} />);

    expect(await screen.findByText("英語の基礎を固める")).toBeInTheDocument();
    expect(screen.getByText("2026-12-01")).toBeInTheDocument();
    expect(screen.getByText("文法を復習する")).toBeInTheDocument();
    expect(screen.getByText("英単語100個を覚える")).toBeInTheDocument();
    expect(screen.getByText("単語帳1〜100")).toBeInTheDocument();
    expect(screen.getByText("高い")).toBeInTheDocument();
    expect(screen.getByText("標準レベル1")).toBeInTheDocument();
    expect(screen.getByText("be動詞")).toBeInTheDocument();
  });

  it("「登録する」で apiClient.post が正しいpayloadで呼ばれ、成功メッセージが表示される", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
    render(<CreateTaskConfirm goalId={9} draftTaskId={1} />);
    await screen.findByText("英単語100個を覚える");

    fireEvent.click(screen.getByRole("button", { name: "登録する" }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/api/student/tasks", {
        task: {
          goal_id: 9,
          title: "英単語100個を覚える",
          content: "単語帳1〜100",
          priority: "high",
          due_date: "2026-09-01",
          unit_ids: [11],
        },
      });
    });
    expect(
      await screen.findByText("タスクが登録されました！"),
    ).toBeInTheDocument();
  });

  it("登録に失敗するとエラーメッセージが表示される", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("failed"));
    render(<CreateTaskConfirm goalId={9} draftTaskId={1} />);
    await screen.findByText("英単語100個を覚える");

    fireEvent.click(screen.getByRole("button", { name: "登録する" }));

    expect(
      await screen.findByText("タスク登録に失敗しました"),
    ).toBeInTheDocument();
  });

  it("「キャンセル」でタスク作成画面へ遷移する", async () => {
    render(<CreateTaskConfirm goalId={9} draftTaskId={1} />);
    await screen.findByText("英単語100個を覚える");

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(pushMock).toHaveBeenCalledWith("/goals/9/tasks/new?draftTaskId=1");
  });

  describe("取得", () => {
    // 目標・下書きタスクそれぞれの GET を、呼び出し回数ごとに失敗や保留にできるAPI。
    // mockRejectedValueOnce の並びではなく URL と呼び出し回数で分岐し、モックの漏れを避ける。
    const api = {
      calls: { goal: 0, draft: 0 },
      failures: {
        goal: new Map<number, number>(),
        draft: new Map<number, number>(),
      },
      gates: {
        goal: new Map<number, Promise<void>>(),
        draft: new Map<number, Promise<void>>(),
      },
    };

    const setupApi = () => {
      api.calls = { goal: 0, draft: 0 };
      api.failures = { goal: new Map(), draft: new Map() };
      api.gates = { goal: new Map(), draft: new Map() };

      vi.mocked(apiClient.get).mockReset();
      vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
        const kind = url.includes("/goals/") ? "goal" : "draft";
        api.calls[kind] += 1;
        const call = api.calls[kind];
        await api.gates[kind].get(call);
        const status = api.failures[kind].get(call);
        if (status) throw { response: { status } };
        return { data: kind === "goal" ? mockGoal : mockDraftTask };
      });
    };

    // 解決を手動で制御できる Promise(保留中の表示を確かめるため)
    const deferred = () => {
      let resolve: () => void = () => {};
      const promise = new Promise<void>((r) => {
        resolve = r;
      });
      return { promise, resolve };
    };

    beforeEach(() => {
      setupApi();
    });

    it("目標の取得に失敗すると、空欄の確認画面ではなくエラー表示と再試行ボタンが出る", async () => {
      api.failures.goal.set(1, 500);

      render(<CreateTaskConfirm goalId={9} draftTaskId={1} />);

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "再試行" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "登録する" }),
      ).not.toBeInTheDocument();
    });

    it("下書きタスクの取得に失敗すると、空欄の確認画面ではなくエラー表示と再試行ボタンが出る", async () => {
      api.failures.draft.set(1, 500);

      render(<CreateTaskConfirm goalId={9} draftTaskId={1} />);

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "再試行" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "登録する" }),
      ).not.toBeInTheDocument();
    });

    it("片方が失敗したとき、再試行で両方を取り直し、成功すると確認画面が出る", async () => {
      api.failures.goal.set(1, 500);
      render(<CreateTaskConfirm goalId={9} draftTaskId={1} />);
      await screen.findByRole("alert");

      fireEvent.click(screen.getByRole("button", { name: "再試行" }));

      expect(await screen.findByText("英語の基礎を固める")).toBeInTheDocument();
      expect(screen.getByText("英単語100個を覚える")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(api.calls).toEqual({ goal: 2, draft: 2 });
    });

    it("401のときは/loginに遷移し、エラーは表示しない", async () => {
      api.failures.goal.set(1, 401);

      render(<CreateTaskConfirm goalId={9} draftTaskId={1} />);

      await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
      await act(async () => {});
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("取得が終わるまで、確認画面の中身は出さず、共通のスピナーだけを出す", async () => {
      const goalGate = deferred();
      const draftGate = deferred();
      api.gates.goal.set(1, goalGate.promise);
      api.gates.draft.set(1, draftGate.promise);

      render(<CreateTaskConfirm goalId={9} draftTaskId={1} />);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.queryByText("確認")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "登録する" }),
      ).not.toBeInTheDocument();

      await act(async () => {
        goalGate.resolve();
        draftGate.resolve();
      });
      expect(
        await screen.findByRole("button", { name: "登録する" }),
      ).toBeInTheDocument();
    });

    it("初回描画(サーバー描画)でも、確認画面の中身は出さずスピナーだけを出す", () => {
      vi.mocked(apiClient.get).mockReset();
      vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

      const html = renderToString(
        <CreateTaskConfirm goalId={9} draftTaskId={1} />,
      );

      expect(html).toContain('role="progressbar"');
      expect(html).not.toContain("登録する");
      expect(html).not.toContain('role="alert"');
    });
  });
});
