import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  InterviewRequest,
  InterviewRequestMessage,
} from "@/types/interview/interviewRequest";
import { Presenter } from "./Presenter";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const interview: InterviewRequest = {
  id: 1,
  status: "scheduling",
  initiator_role: "student",
  reason_category: "career",
  reason_detail: "志望校について相談したい",
  scheduled_at: null,
  completed_at: null,
  cancelled_at: null,
  cancel_reason: null,
  lock_version: 2,
  created_at: "2026-10-01T10:00:00+09:00",
  student_id: 10,
  student_name: "生徒太郎",
  teacher_id: 20,
  teacher_name: "担任先生",
};

const messages: InterviewRequestMessage[] = [
  {
    id: 100,
    body: "よろしくお願いします",
    sender_id: 10,
    sender_name: "生徒太郎",
    created_at: "2026-10-01T10:05:00+09:00",
  },
  {
    id: 101,
    body: "来週の放課後はどうですか",
    sender_id: 20,
    sender_name: "担任先生",
    created_at: "2026-10-02T09:00:00+09:00",
  },
];

const defaultProps = {
  interview,
  messages,
  onSendMessage: vi.fn().mockResolvedValue(true),
  sendError: "",
  onCancel: vi.fn().mockResolvedValue(true),
  cancelError: "",
  onClearCancelError: vi.fn(),
};

describe("InterviewDetailPresenter", () => {
  describe("面談情報", () => {
    it("教員名・ステータス・相談カテゴリ・相談内容と一覧への戻るリンクを表示する", () => {
      render(<Presenter {...defaultProps} />);
      expect(
        screen.getByRole("heading", { name: "担任先生との面談", level: 1 }),
      ).toBeInTheDocument();
      expect(screen.getByText("日程調整中")).toBeInTheDocument();
      expect(screen.getByText("進路")).toBeInTheDocument();
      expect(screen.getByText("志望校について相談したい")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "面談一覧へ" })).toHaveAttribute(
        "href",
        "/interviews",
      );
    });

    it("予定日時があれば表示する", () => {
      render(
        <Presenter
          {...defaultProps}
          interview={{
            ...interview,
            status: "confirmed",
            scheduled_at: "2026-10-20T15:30:00+09:00",
          }}
        />,
      );
      expect(screen.getByText("2026/10/20 15:30")).toBeInTheDocument();
    });

    it("キャンセル済みの面談はキャンセル理由を表示する", () => {
      render(
        <Presenter
          {...defaultProps}
          interview={{
            ...interview,
            status: "cancelled",
            cancelled_at: "2026-10-03T10:00:00+09:00",
            cancel_reason: "都合が悪くなった",
          }}
        />,
      );
      expect(screen.getByText("都合が悪くなった")).toBeInTheDocument();
    });
  });

  describe("メッセージ", () => {
    it("メッセージを送信者名・本文つきで時系列に表示し、自分のメッセージには「自分」と表示する", () => {
      render(<Presenter {...defaultProps} />);
      const items = within(
        screen.getByRole("list", { name: "メッセージ" }),
      ).getAllByRole("listitem");
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent("自分");
      expect(items[0]).toHaveTextContent("よろしくお願いします");
      expect(items[1]).toHaveTextContent("担任先生");
      expect(items[1]).toHaveTextContent("来週の放課後はどうですか");
    });

    it("メッセージが無いときは案内を表示する", () => {
      render(<Presenter {...defaultProps} messages={[]} />);
      expect(
        screen.getByText("まだメッセージはありません"),
      ).toBeInTheDocument();
    });

    it("入力して送信すると onSendMessage が呼ばれ、成功したら入力欄が空になる", async () => {
      const onSendMessage = vi.fn().mockResolvedValue(true);
      render(<Presenter {...defaultProps} onSendMessage={onSendMessage} />);
      const input = screen.getByRole("textbox", { name: "メッセージを入力" });
      fireEvent.change(input, { target: { value: "はい、大丈夫です" } });
      fireEvent.click(screen.getByRole("button", { name: "送信" }));

      await waitFor(() =>
        expect(onSendMessage).toHaveBeenCalledWith("はい、大丈夫です"),
      );
      await waitFor(() => expect(input).toHaveValue(""));
    });

    it("空のまま送信しても onSendMessage は呼ばれない", async () => {
      const onSendMessage = vi.fn();
      render(<Presenter {...defaultProps} onSendMessage={onSendMessage} />);
      fireEvent.change(
        screen.getByRole("textbox", { name: "メッセージを入力" }),
        { target: { value: "   " } },
      );
      fireEvent.click(screen.getByRole("button", { name: "送信" }));

      expect(
        await screen.findByText("メッセージを入力してください"),
      ).toBeInTheDocument();
      expect(onSendMessage).not.toHaveBeenCalled();
    });

    it("sendError があれば表示する", () => {
      render(<Presenter {...defaultProps} sendError="送信に失敗しました" />);
      expect(screen.getByText("送信に失敗しました")).toBeInTheDocument();
    });

    it.each(["completed", "cancelled"] as const)(
      "%s の面談では送信フォームを表示しない",
      (status) => {
        render(
          <Presenter {...defaultProps} interview={{ ...interview, status }} />,
        );
        expect(
          screen.queryByRole("textbox", { name: "メッセージを入力" }),
        ).not.toBeInTheDocument();
      },
    );
  });

  describe("キャンセル", () => {
    const openDialog = () => {
      fireEvent.click(screen.getByRole("button", { name: "面談をキャンセル" }));
      return screen.getByRole("dialog");
    };

    it.each(["completed", "cancelled"] as const)(
      "%s の面談ではキャンセルボタンを表示しない",
      (status) => {
        render(
          <Presenter {...defaultProps} interview={{ ...interview, status }} />,
        );
        expect(
          screen.queryByRole("button", { name: "面談をキャンセル" }),
        ).not.toBeInTheDocument();
      },
    );

    it("理由を入力せずに確定するとエラーになり onCancel は呼ばれない", async () => {
      const onCancel = vi.fn();
      render(<Presenter {...defaultProps} onCancel={onCancel} />);
      const dialog = openDialog();
      fireEvent.click(
        within(dialog).getByRole("button", { name: "キャンセルする" }),
      );

      expect(
        await within(dialog).findByText("キャンセル理由を入力してください"),
      ).toBeInTheDocument();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("理由を入力して確定すると onCancel が呼ばれ、成功したらダイアログが閉じる", async () => {
      const onCancel = vi.fn().mockResolvedValue(true);
      render(<Presenter {...defaultProps} onCancel={onCancel} />);
      const dialog = openDialog();
      fireEvent.change(
        within(dialog).getByRole("textbox", { name: "キャンセル理由" }),
        { target: { value: "都合が悪くなった" } },
      );
      fireEvent.click(
        within(dialog).getByRole("button", { name: "キャンセルする" }),
      );

      await waitFor(() =>
        expect(onCancel).toHaveBeenCalledWith("都合が悪くなった"),
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
    });

    it("失敗したときはダイアログを開いたまま cancelError を表示する", async () => {
      const conflict =
        "他のユーザーによってデータが更新されています。再読み込みしてください";
      render(<Presenter {...defaultProps} cancelError={conflict} />);
      const dialog = openDialog();
      expect(within(dialog).getByRole("alert")).toHaveTextContent(conflict);
    });

    it("「戻る」でダイアログを閉じると onClearCancelError が呼ばれる", async () => {
      const onClearCancelError = vi.fn();
      render(
        <Presenter {...defaultProps} onClearCancelError={onClearCancelError} />,
      );
      const dialog = openDialog();
      fireEvent.click(within(dialog).getByRole("button", { name: "戻る" }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(onClearCancelError).toHaveBeenCalled();
    });
  });
});
