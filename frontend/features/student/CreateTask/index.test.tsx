import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
    render(<CreateTask goalId={1} draftTaskId={0} />);
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
    render(<CreateTask goalId={1} draftTaskId={0} />);
    expect(screen.getByText("タスク作成")).toBeInTheDocument();
    expect(screen.getByText("タスクタイトル")).toBeInTheDocument();
    expect(screen.getByText("タスク内容")).toBeInTheDocument();
    expect(screen.getByText("講座を選択")).toBeInTheDocument();
  });

  it("必須項目が空のまま送信するとエラーメッセージが表示される", async () => {
    render(<CreateTask goalId={1} draftTaskId={0} />);
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    await waitFor(() => {
      expect(screen.getByText("目標名を入力してください")).toBeInTheDocument();
      expect(screen.getByText("期限を選択してください")).toBeInTheDocument();
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("教科を選択すると講座一覧が取得され表示される", async () => {
    render(<CreateTask goalId={1} draftTaskId={0} />);
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
    render(<CreateTask goalId={1} draftTaskId={0} />);
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
    render(<CreateTask goalId={1} draftTaskId={0} />);

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
    render(<CreateTask goalId={1} draftTaskId={0} />);
    expect(screen.getByRole("link", { name: /後で作成する/ })).toHaveAttribute(
      "href",
      "/",
    );
  });

  describe("確認画面から戻ったとき(下書きがあるとき)", () => {
    // API(Rails の enum)は優先度を文字列で返す
    const mockDraftTask = {
      id: 5,
      goal_id: 9,
      title: "英単語100個を覚える",
      content: "単語帳1〜100",
      priority: "high",
      due_date: "2026-09-01",
      units: [],
    };

    beforeEach(() => {
      // mockResolvedValueOnce は消化漏れが起きやすいので、URL で出し分ける
      vi.mocked(apiClient.get).mockReset();
      vi.mocked(apiClient.get).mockImplementation(async (url: string) =>
        url.includes("draft-tasks")
          ? { data: mockDraftTask }
          : { data: mockCourses },
      );
    });

    it("下書きの優先度(文字列)が、フォームの優先度に戻る", async () => {
      render(<CreateTask goalId={9} draftTaskId={5} />);

      // 取得は非同期なので、取得後に「高い」が出るのを待つ
      await waitFor(() =>
        expect(
          screen.getByRole("combobox", { name: "優先度" }),
        ).toHaveTextContent("高い"),
      );
      expect(
        screen.getByDisplayValue("英単語100個を覚える"),
      ).toBeInTheDocument();
    });
  });
});
