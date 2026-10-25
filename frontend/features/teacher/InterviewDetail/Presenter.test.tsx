import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

vi.mock("@mui/x-date-pickers/DateTimePicker", () => ({
  DateTimePicker: ({
    value,
    onChange,
  }: {
    value: Date | null;
    onChange: (date: Date | null) => void;
  }) => (
    <input
      aria-label="予定日時"
      type="text"
      value={value ? value.toISOString() : ""}
      onChange={(e) =>
        onChange(e.target.value ? new Date(e.target.value) : null)
      }
    />
  ),
}));

const interview: InterviewRequest = {
  id: 1,
  status: "requested",
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

const conflictMessage =
  "他のユーザーによってデータが更新されています。再読み込みしてください";

const props = {
  messages,
  onSchedule: vi.fn(),
  onComplete: vi.fn(),
  onCancel: vi.fn(),
  actionError: "",
  onClearActionError: vi.fn(),
  onSendMessage: vi.fn(),
  sendError: "",
};

const renderPresenter = (
  overrides: Partial<InterviewRequest> = {},
  extra: Partial<typeof props> = {},
) =>
  render(
    <Presenter
      {...props}
      interview={{ ...interview, ...overrides }}
      {...extra}
    />,
  );

const actionButtons = ["日程を確定", "完了にする", "却下", "キャンセル"];
const visibleActions = () =>
  actionButtons.filter((name) => screen.queryByRole("button", { name }));

describe("InterviewDetailPresenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    props.onSchedule.mockResolvedValue(true);
    props.onComplete.mockResolvedValue(true);
    props.onCancel.mockResolvedValue(true);
    props.onSendMessage.mockResolvedValue(true);
  });

  describe("面談情報", () => {
    it("生徒名・ステータス・申請元・相談カテゴリ・相談内容と一覧への戻るリンクを表示する", () => {
      renderPresenter();

      expect(
        screen.getByRole("heading", { name: "生徒太郎さんとの面談", level: 1 }),
      ).toBeInTheDocument();
      expect(screen.getByText("申請中")).toBeInTheDocument();
      expect(screen.getByText("生徒から")).toBeInTheDocument();
      expect(screen.getByText("進路")).toBeInTheDocument();
      expect(screen.getByText("志望校について相談したい")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "一覧へ戻る" })).toHaveAttribute(
        "href",
        "/teacher/interviews",
      );
    });

    it("生徒名から生徒詳細へ移動できる", () => {
      renderPresenter();

      expect(screen.getByRole("link", { name: "生徒太郎" })).toHaveAttribute(
        "href",
        "/teacher/students/10",
      );
    });

    it("教員からの申請は、相談カテゴリを「-」で表示する", () => {
      renderPresenter({ initiator_role: "teacher", reason_category: null });

      expect(screen.getByText("教員から")).toBeInTheDocument();
      expect(screen.getByText("-")).toBeInTheDocument();
    });

    it("確定した面談は予定日時を表示する", () => {
      renderPresenter({
        status: "confirmed",
        scheduled_at: "2026-11-01T16:00:00+09:00",
      });

      expect(screen.getByText("2026/11/01 16:00")).toBeInTheDocument();
    });

    it("キャンセルされた面談はキャンセル理由を表示する", () => {
      renderPresenter({
        status: "cancelled",
        cancelled_at: "2026-10-03T10:00:00+09:00",
        cancel_reason: "体調不良のため",
      });

      expect(screen.getByText("体調不良のため")).toBeInTheDocument();
    });
  });

  describe("操作ボタン(許可された操作だけを出す)", () => {
    it("生徒からの申請中は「日程を確定」「却下」", () => {
      renderPresenter();
      expect(visibleActions()).toEqual(["日程を確定", "却下"]);
    });

    it("教員からの申請中は「日程を確定」「キャンセル」", () => {
      renderPresenter({ initiator_role: "teacher", reason_category: null });
      expect(visibleActions()).toEqual(["日程を確定", "キャンセル"]);
    });

    it("日程調整中は「日程を確定」「キャンセル」", () => {
      renderPresenter({ status: "scheduling" });
      expect(visibleActions()).toEqual(["日程を確定", "キャンセル"]);
    });

    it("確定は「完了にする」「キャンセル」", () => {
      renderPresenter({
        status: "confirmed",
        scheduled_at: "2026-11-01T16:00:00+09:00",
      });
      expect(visibleActions()).toEqual(["完了にする", "キャンセル"]);
    });

    it.each(["completed", "cancelled"] as const)(
      "%s はどの操作も出さない",
      (status) => {
        renderPresenter({ status });
        expect(visibleActions()).toEqual([]);
      },
    );
  });

  describe("操作", () => {
    it("「日程を確定」でダイアログを開き、入力した予定日時で確定する", async () => {
      renderPresenter();

      fireEvent.click(screen.getByRole("button", { name: "日程を確定" }));
      const dialog = screen.getByRole("dialog");
      fireEvent.change(within(dialog).getByLabelText("予定日時"), {
        target: { value: "2099-11-01T07:00:00.000Z" },
      });
      fireEvent.click(within(dialog).getByRole("button", { name: "確定する" }));

      await waitFor(() =>
        expect(props.onSchedule).toHaveBeenCalledWith(
          new Date("2099-11-01T07:00:00.000Z"),
        ),
      );
    });

    it("「却下」で却下のダイアログを開き、理由を入力して却下する", async () => {
      renderPresenter();

      fireEvent.click(screen.getByRole("button", { name: "却下" }));
      const dialog = screen.getByRole("dialog");
      expect(
        within(dialog).getByRole("heading", { name: "面談の申請を却下" }),
      ).toBeInTheDocument();
      fireEvent.change(within(dialog).getByLabelText("却下理由"), {
        target: { value: "担当外の相談のため" },
      });
      fireEvent.click(within(dialog).getByRole("button", { name: "却下する" }));

      await waitFor(() =>
        expect(props.onCancel).toHaveBeenCalledWith("担当外の相談のため"),
      );
    });

    it("「完了にする」で確認ダイアログを開き、完了にする", async () => {
      renderPresenter({ status: "confirmed" });

      fireEvent.click(screen.getByRole("button", { name: "完了にする" }));
      fireEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "完了にする",
        }),
      );

      await waitFor(() => expect(props.onComplete).toHaveBeenCalled());
    });

    it("他の教員が先に処理していた(409)ときは、開いているダイアログにエラーを表示する", () => {
      const { rerender } = renderPresenter();

      fireEvent.click(screen.getByRole("button", { name: "日程を確定" }));
      rerender(
        <Presenter
          {...props}
          interview={interview}
          actionError={conflictMessage}
        />,
      );

      expect(
        within(screen.getByRole("dialog")).getByRole("alert"),
      ).toHaveTextContent(conflictMessage);
    });

    it("取り直した結果その操作ができない状態になっても、ダイアログとエラーは残す", () => {
      const { rerender } = renderPresenter();

      fireEvent.click(screen.getByRole("button", { name: "却下" }));
      rerender(
        <Presenter
          {...props}
          interview={{ ...interview, status: "cancelled" }}
          actionError="進行中の面談のみキャンセルできます"
        />,
      );

      expect(
        within(screen.getByRole("dialog")).getByRole("alert"),
      ).toHaveTextContent("進行中の面談のみキャンセルできます");
    });

    it("却下のダイアログは、閉じるアニメーションの間も却下の文言のままにする", () => {
      renderPresenter();

      fireEvent.click(screen.getByRole("button", { name: "却下" }));
      fireEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "戻る",
        }),
      );

      expect(screen.queryByText("面談をキャンセル")).not.toBeInTheDocument();
      expect(screen.getByText("面談の申請を却下")).toBeInTheDocument();
    });

    it("ダイアログを閉じるとエラーを消す", async () => {
      renderPresenter();

      fireEvent.click(screen.getByRole("button", { name: "日程を確定" }));
      fireEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "戻る",
        }),
      );

      expect(props.onClearActionError).toHaveBeenCalled();
    });
  });

  describe("メッセージ", () => {
    it("メッセージのスレッドを表示する", () => {
      renderPresenter();

      const list = screen.getByRole("list", { name: "メッセージ" });
      expect(
        within(list).getByText("よろしくお願いします"),
      ).toBeInTheDocument();
      expect(
        within(list).getByText("来週の放課後はどうですか"),
      ).toBeInTheDocument();
    });

    it("入力したメッセージを送信できる", async () => {
      renderPresenter();

      fireEvent.change(screen.getByLabelText("メッセージを入力"), {
        target: { value: "金曜の16時はどうですか" },
      });
      fireEvent.click(screen.getByRole("button", { name: "送信" }));

      await waitFor(() =>
        expect(props.onSendMessage).toHaveBeenCalledWith(
          "金曜の16時はどうですか",
        ),
      );
    });

    it("送信に失敗したときはエラーを表示する", () => {
      renderPresenter({}, { sendError: "メッセージの送信に失敗しました" });

      expect(screen.getByRole("alert")).toHaveTextContent(
        "メッセージの送信に失敗しました",
      );
    });

    it.each([
      ["completed", "この面談は完了しました"],
      ["cancelled", "この面談はキャンセルされました"],
    ] as const)(
      "%s の面談では入力欄の代わりに案内を表示する",
      (status, notice) => {
        renderPresenter({ status });

        expect(
          screen.queryByLabelText("メッセージを入力"),
        ).not.toBeInTheDocument();
        expect(screen.getByText(notice)).toBeInTheDocument();
      },
    );

    it("送信が失敗して面談が終了済みに切り替わっても、エラーを残す", () => {
      renderPresenter(
        { status: "cancelled" },
        { sendError: "終了した面談にはメッセージを投稿できません" },
      );

      expect(screen.getByRole("alert")).toHaveTextContent(
        "終了した面談にはメッセージを投稿できません",
      );
    });
  });
});
