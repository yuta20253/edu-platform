import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SchoolClassRequest } from "@/types/schoolClassRequest/schoolClassRequest";
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

const request: SchoolClassRequest = {
  id: 1,
  action: "modification",
  status: "pending",
  name: "3組(特進)",
  reason: null,
  lock_version: 2,
  approved_at: null,
  cancelled_at: null,
  created_at: "2026-10-01T10:00:00+09:00",
  school_class: { id: 30, name: "3組" },
  applicant: { id: 10, name: "申請先生" },
  approver: null,
  grade: { id: 2, year: 2, display_name: "高2" },
  can_process: true,
  can_cancel: false,
};

const conflictMessage =
  "この申請はすでに処理されています。再読み込みしてください";

const props = {
  onApprove: vi.fn(),
  onReject: vi.fn(),
  onCancel: vi.fn(),
  actionError: "",
  onClearActionError: vi.fn(),
  refreshError: false,
  onRetry: vi.fn(),
};

const renderPresenter = (
  overrides: Partial<SchoolClassRequest> = {},
  extra: Partial<typeof props> = {},
) =>
  render(
    <Presenter
      {...props}
      request={{ ...request, ...overrides }}
      {...extra}
    />,
  );

// 項目名(dt)に対応する値(dd)
const valueOf = (label: string) =>
  screen.getByText(label, { selector: "dt" }).nextElementSibling;

const actionButtons = ["承認", "却下", "取り消す"];
const visibleActions = () =>
  actionButtons.filter((name) => screen.queryByRole("button", { name }));

describe("SchoolClassRequestDetailPresenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    props.onApprove.mockResolvedValue(true);
    props.onReject.mockResolvedValue(true);
    props.onCancel.mockResolvedValue(true);
  });

  describe("申請の内容", () => {
    it("種別・ステータス・学年・対象クラス・新しいクラス名・申請者・申請日時と一覧への戻るリンクを表示する", () => {
      renderPresenter();

      expect(
        screen.getByRole("heading", { name: "学級改名の申請", level: 1 }),
      ).toBeInTheDocument();
      expect(screen.getByText("承認待ち")).toBeInTheDocument();
      expect(valueOf("種別")).toHaveTextContent("改名");
      expect(valueOf("学年")).toHaveTextContent("高2");
      expect(valueOf("対象クラス")).toHaveTextContent("3組");
      expect(valueOf("新しいクラス名")).toHaveTextContent("3組(特進)");
      expect(valueOf("申請者")).toHaveTextContent("申請先生");
      expect(valueOf("申請日時")).toHaveTextContent("2026/10/01 10:00");
      expect(screen.getByRole("link", { name: "一覧へ戻る" })).toHaveAttribute(
        "href",
        "/teacher/school-class-requests",
      );
    });

    it("新設の申請には対象クラスを表示しない", () => {
      renderPresenter({ action: "creation", school_class: null });

      expect(
        screen.getByRole("heading", { name: "学級新設の申請", level: 1 }),
      ).toBeInTheDocument();
      expect(screen.queryByText("対象クラス")).not.toBeInTheDocument();
      expect(valueOf("新しいクラス名")).toHaveTextContent("3組(特進)");
    });

    it("削除の申請には新しいクラス名を表示しない", () => {
      renderPresenter({ action: "deletion", name: null });

      expect(screen.queryByText("新しいクラス名")).not.toBeInTheDocument();
      expect(valueOf("対象クラス")).toHaveTextContent("3組");
    });

    it("承認後に削除されたクラスは、対象クラスを「削除済み」と表示する", () => {
      renderPresenter({
        action: "deletion",
        name: null,
        status: "approved",
        school_class: null,
        approver: { id: 20, name: "承認先生" },
        approved_at: "2026-10-02T09:00:00+09:00",
        can_process: false,
      });

      expect(valueOf("対象クラス")).toHaveTextContent("削除済み");
    });
  });

  describe("処理結果", () => {
    it("承認待ちの申請には処理結果を表示しない", () => {
      renderPresenter();

      expect(
        screen.queryByRole("heading", { name: "処理結果" }),
      ).not.toBeInTheDocument();
    });

    it("承認された申請は、処理者と承認日時を表示する", () => {
      renderPresenter({
        status: "approved",
        approver: { id: 20, name: "承認先生" },
        approved_at: "2026-10-02T09:00:00+09:00",
        can_process: false,
      });

      expect(
        screen.getByRole("heading", { name: "処理結果" }),
      ).toBeInTheDocument();
      expect(valueOf("処理者")).toHaveTextContent("承認先生");
      expect(valueOf("承認日時")).toHaveTextContent("2026/10/02 09:00");
    });

    it("却下された申請は、処理者と却下理由を表示する", () => {
      renderPresenter({
        status: "rejected",
        approver: { id: 20, name: "承認先生" },
        reason: "同じ名前のクラスがあるため",
        can_process: false,
      });

      expect(valueOf("処理者")).toHaveTextContent("承認先生");
      expect(valueOf("却下理由")).toHaveTextContent(
        "同じ名前のクラスがあるため",
      );
    });

    it("取り消された申請は、取消日時と取消理由を表示する", () => {
      renderPresenter({
        status: "cancelled",
        cancelled_at: "2026-10-03T10:00:00+09:00",
        reason: "申請先のクラスを間違えたため",
        can_process: false,
      });

      expect(valueOf("取消日時")).toHaveTextContent("2026/10/03 10:00");
      expect(valueOf("取消理由")).toHaveTextContent(
        "申請先のクラスを間違えたため",
      );
    });

    it("理由を入力せずに取り消された申請は、取消理由を「-」で表示する", () => {
      renderPresenter({
        status: "cancelled",
        cancelled_at: "2026-10-03T10:00:00+09:00",
        reason: null,
        can_process: false,
      });

      expect(valueOf("取消理由")).toHaveTextContent("-");
    });
  });

  describe("操作ボタン", () => {
    it("承認/却下できる申請には、承認・却下ボタンを表示する", () => {
      renderPresenter();

      expect(visibleActions()).toEqual(["承認", "却下"]);
    });

    it("取り消せる申請には、取り消すボタンだけを表示する", () => {
      renderPresenter({ can_process: false, can_cancel: true });

      expect(visibleActions()).toEqual(["取り消す"]);
    });

    it("どちらもできない申請には、操作ボタンを表示しない", () => {
      renderPresenter({ can_process: false, can_cancel: false });

      expect(visibleActions()).toEqual([]);
    });
  });

  describe("操作", () => {
    it("承認ボタンから確認して承認する", async () => {
      renderPresenter();

      fireEvent.click(screen.getByRole("button", { name: "承認" }));
      fireEvent.click(screen.getByRole("button", { name: "承認する" }));

      await waitFor(() => expect(props.onApprove).toHaveBeenCalled());
    });

    it("却下ボタンから理由を入力して却下する", async () => {
      renderPresenter();

      fireEvent.click(screen.getByRole("button", { name: "却下" }));
      fireEvent.change(screen.getByLabelText(/却下理由/), {
        target: { value: "同じ名前のクラスがあるため" },
      });
      fireEvent.click(screen.getByRole("button", { name: "却下する" }));

      await waitFor(() =>
        expect(props.onReject).toHaveBeenCalledWith(
          "同じ名前のクラスがあるため",
        ),
      );
    });

    it("取り消すボタンから取り消す", async () => {
      renderPresenter({ can_process: false, can_cancel: true });

      fireEvent.click(screen.getByRole("button", { name: "取り消す" }));
      fireEvent.change(screen.getByLabelText(/取消理由/), {
        target: { value: "申請先のクラスを間違えたため" },
      });
      fireEvent.click(
        screen.getAllByRole("button", { name: "取り消す" }).at(-1)!,
      );

      await waitFor(() =>
        expect(props.onCancel).toHaveBeenCalledWith(
          "申請先のクラスを間違えたため",
        ),
      );
    });

    it("他の教員が先に処理して(409)承認できなくなっても、ダイアログを開いたままエラーを表示する", () => {
      const { rerender } = renderPresenter();
      fireEvent.click(screen.getByRole("button", { name: "却下" }));

      // 409 の後に取り直し、他の教員が承認済みの状態に変わった
      rerender(
        <Presenter
          {...props}
          request={{
            ...request,
            status: "approved",
            approver: { id: 20, name: "承認先生" },
            approved_at: "2026-10-02T09:00:00+09:00",
            can_process: false,
          }}
          actionError={conflictMessage}
        />,
      );

      expect(
        screen.getByRole("heading", { name: "申請を却下" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent(conflictMessage);
    });

    it("ダイアログを閉じると、操作のエラーを消す", async () => {
      renderPresenter({}, { actionError: conflictMessage });

      fireEvent.click(screen.getByRole("button", { name: "承認" }));
      fireEvent.click(screen.getByRole("button", { name: "戻る" }));

      expect(props.onClearActionError).toHaveBeenCalled();
    });
  });

  describe("取り直しの失敗", () => {
    it("申請の内容を残したまま、エラーと再試行を表示する", () => {
      renderPresenter({}, { refreshError: true });

      expect(
        screen.getByRole("heading", { name: "学級改名の申請", level: 1 }),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "再試行" }));

      expect(props.onRetry).toHaveBeenCalled();
    });
  });
});
