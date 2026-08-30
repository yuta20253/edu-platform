import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

    expect(pushMock).toHaveBeenCalledWith(
      "/goals/9/tasks/new?draftTaskId=1",
    );
  });
});
