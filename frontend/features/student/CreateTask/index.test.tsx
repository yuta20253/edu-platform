import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateTask } from "./index";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

import { apiClient } from "@/libs/http/apiClient";

const mockCourses = [
  {
    id: 1,
    level_number: 1,
    level_name: "標準",
    description: "基礎講座",
    units: [
      {
        id: 11,
        course_id: 1,
        unit_name: "be動詞",
        course: { id: 1, level_number: 1, level_name: "標準" },
      },
      {
        id: 12,
        course_id: 1,
        unit_name: "一般動詞",
        course: { id: 1, level_number: 1, level_name: "標準" },
      },
    ],
  },
];

describe("CreateTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockCourses });
    vi.mocked(apiClient.post).mockResolvedValue({ data: 100 });
  });

  it("入力欄がラベルと関連付けられている", () => {
    render(<CreateTask goalId={1} draftTaskId={null} />);
    expect(screen.getByLabelText("タスクタイトル")).toBeInTheDocument();
    expect(screen.getByLabelText("タスク内容")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "優先度" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "教科選択" }),
    ).toBeInTheDocument();
  });

  it("見出し「タスク作成」とフォーム項目が表示される", () => {
    render(<CreateTask goalId={1} draftTaskId={null} />);
    expect(screen.getByText("タスク作成")).toBeInTheDocument();
    expect(screen.getByText("タスクタイトル")).toBeInTheDocument();
    expect(screen.getByText("タスク内容")).toBeInTheDocument();
    expect(screen.getByText("講座を選択")).toBeInTheDocument();
  });

  it("必須項目が空のまま送信するとエラーメッセージが表示される", async () => {
    render(<CreateTask goalId={1} draftTaskId={null} />);
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    await waitFor(() => {
      expect(screen.getByText("目標名を入力してください")).toBeInTheDocument();
      expect(screen.getByText("期限を選択してください")).toBeInTheDocument();
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("教科を選択すると講座一覧が取得され表示される", async () => {
    render(<CreateTask goalId={1} draftTaskId={null} />);
    const subjectSelect = screen.getAllByRole("combobox")[1];
    fireEvent.mouseDown(subjectSelect);
    fireEvent.click(screen.getByRole("option", { name: "英語" }));

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/student/courses?subject=英語",
      );
    });
    expect(await screen.findByText("標準レベル1")).toBeInTheDocument();
  });

  it("講座の「詳細を見る」を押すと単元一覧が表示され、チェックできる", async () => {
    render(<CreateTask goalId={1} draftTaskId={null} />);
    const subjectSelect = screen.getAllByRole("combobox")[1];
    fireEvent.mouseDown(subjectSelect);
    fireEvent.click(screen.getByRole("option", { name: "英語" }));

    fireEvent.click(await screen.findByRole("button", { name: "詳細を見る" }));

    expect(screen.getByText("単元一覧")).toBeInTheDocument();
    const checkbox = screen.getByLabelText("be動詞");
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("必須項目を入力して送信すると apiClient.post が呼ばれ確認画面へ遷移する", async () => {
    const user = userEvent.setup();
    render(<CreateTask goalId={1} draftTaskId={null} />);

    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "英単語を覚える" },
    });

    await user.click(screen.getByRole("spinbutton", { name: "Year" }));
    await user.keyboard("2026");
    await user.keyboard("09");
    await user.keyboard("01");

    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/student/draft-tasks",
        expect.objectContaining({
          draft_task: expect.objectContaining({
            goal_id: 1,
            title: "英単語を覚える",
            priority: 3,
            unit_ids: [],
          }),
        }),
      );
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/goals/1/tasks/confirm?draft_task_id=100",
    );
  });

  it("「後で作成する」ボタンが / を指すリンクになっている", () => {
    render(<CreateTask goalId={1} draftTaskId={null} />);
    expect(screen.getByRole("link", { name: /後で作成する/ })).toHaveAttribute(
      "href",
      "/",
    );
  });

  describe("下書きの取得(URL で出し分けるモック)", () => {
    const mockDraftTask = {
      id: 5,
      goal_id: 9,
      title: "英単語100個を覚える",
      content: "単語帳1〜100",
      // 優先度は比べない(TSK-225 で扱う。固定すると不具合を固定してしまう)
      priority: "normal",
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

    const draftGetCalls = () =>
      vi
        .mocked(apiClient.get)
        .mock.calls.filter(([url]) => String(url).includes("draft-tasks"));

    beforeEach(() => {
      // 未消化の mockResolvedValueOnce が漏れないよう、URL で出し分けて reset する
      vi.mocked(apiClient.get).mockReset();
      vi.mocked(apiClient.get).mockImplementation(async (url: string) =>
        url.includes("draft-tasks")
          ? { data: mockDraftTask }
          : { data: mockCourses },
      );
    });

    it("下書きがあるとき、タイトル・内容がフォームの初期値になる", async () => {
      render(<CreateTask goalId={9} draftTaskId={5} />);

      expect(
        await screen.findByDisplayValue("英単語100個を覚える"),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("単語帳1〜100")).toBeInTheDocument();
    });

    it("下書きの単元が、チェック済みで表示される", async () => {
      render(<CreateTask goalId={9} draftTaskId={5} />);
      await screen.findByDisplayValue("英単語100個を覚える");

      const subjectSelect = screen.getAllByRole("combobox")[1];
      fireEvent.mouseDown(subjectSelect);
      fireEvent.click(screen.getByRole("option", { name: "英語" }));
      fireEvent.click(
        await screen.findByRole("button", { name: "詳細を見る" }),
      );

      expect(screen.getByLabelText("be動詞")).toBeChecked();
      expect(screen.getByLabelText("一般動詞")).not.toBeChecked();
    });

    it("送信すると、下書きの期限と単元が POST のボディになる", async () => {
      render(<CreateTask goalId={9} draftTaskId={5} />);
      await screen.findByDisplayValue("英単語100個を覚える");

      fireEvent.click(screen.getByRole("button", { name: "次へ" }));

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          "/api/student/draft-tasks",
          expect.objectContaining({
            draft_task: expect.objectContaining({
              goal_id: 9,
              title: "英単語100個を覚える",
              content: "単語帳1〜100",
              due_date: new Date("2026-09-01"),
              unit_ids: [11],
            }),
          }),
        );
      });
    });

    it("下書きの ID があるとき、下書きを 1 回取得する", async () => {
      render(<CreateTask goalId={9} draftTaskId={5} />);
      await screen.findByDisplayValue("英単語100個を覚える");

      // 呼び出しの引数の形(signal など)には依存せず、URL と回数だけを見る
      expect(draftGetCalls().map(([url]) => url)).toEqual([
        "/api/student/draft-tasks/5",
      ]);
    });

    describe("下書きの取得に失敗するなど、取得が思いどおりに進まないとき", () => {
      // 下書きの GET を、呼び出し回数ごとに失敗や保留にできるモック
      const draftApi = {
        calls: 0,
        failures: new Map<number, number>(),
        gates: new Map<number, Promise<void>>(),
      };

      const deferred = () => {
        let resolve: () => void = () => {};
        const promise = new Promise<void>((r) => {
          resolve = r;
        });
        return { promise, resolve };
      };

      beforeEach(() => {
        draftApi.calls = 0;
        draftApi.failures = new Map();
        draftApi.gates = new Map();
        vi.mocked(apiClient.get).mockReset();
        vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
          if (!url.includes("draft-tasks")) return { data: mockCourses };

          draftApi.calls += 1;
          const call = draftApi.calls;
          await draftApi.gates.get(call);
          const status = draftApi.failures.get(call);
          if (status) throw { response: { status } };
          return { data: mockDraftTask };
        });
      });

      it("取得に失敗すると、空のフォームではなく、エラー表示と再試行ボタンが出る", async () => {
        draftApi.failures.set(1, 500);

        render(<CreateTask goalId={9} draftTaskId={5} />);

        expect(await screen.findByRole("alert")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "再試行" }),
        ).toBeInTheDocument();
        expect(screen.queryByText("タスク作成")).not.toBeInTheDocument();
      });

      it("失敗 → 再試行 → 成功のあと、下書きの内容がフォームに入る", async () => {
        draftApi.failures.set(1, 500);
        render(<CreateTask goalId={9} draftTaskId={5} />);
        await screen.findByRole("alert");

        fireEvent.click(screen.getByRole("button", { name: "再試行" }));

        expect(
          await screen.findByDisplayValue("英単語100個を覚える"),
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue("単語帳1〜100")).toBeInTheDocument();
        expect(draftApi.calls).toBe(2);
      });

      it("401のときは /login に遷移し、エラーは表示しない", async () => {
        draftApi.failures.set(1, 401);

        render(<CreateTask goalId={9} draftTaskId={5} />);

        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
        await act(async () => {});
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });

      it("取得が終わるまで、フォームの中身は出さず、共通のスピナーだけを出す", async () => {
        const gate = deferred();
        draftApi.gates.set(1, gate.promise);

        render(<CreateTask goalId={9} draftTaskId={5} />);

        expect(screen.getByRole("progressbar")).toBeInTheDocument();
        expect(screen.queryByText("タスク作成")).not.toBeInTheDocument();
        expect(
          screen.queryByLabelText("タスクタイトル"),
        ).not.toBeInTheDocument();

        await act(async () => {
          gate.resolve();
        });
        expect(
          await screen.findByDisplayValue("英単語100個を覚える"),
        ).toBeInTheDocument();
      });
    });

    it("新規作成(draftTaskId なし)では、下書きを取得しない", async () => {
      render(<CreateTask goalId={9} draftTaskId={null} />);

      // 講座一覧の取得は教科選択で呼ばれる。呼び出し回数ではなく、下書きの URL の有無で確かめる
      const subjectSelect = screen.getAllByRole("combobox")[1];
      fireEvent.mouseDown(subjectSelect);
      fireEvent.click(screen.getByRole("option", { name: "英語" }));
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          "/api/student/courses?subject=英語",
        );
      });

      expect(draftGetCalls()).toHaveLength(0);
    });
  });
});
