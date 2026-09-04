import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { ImportHistoryDetailData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    href: string;
    "aria-label"?: string;
  }) => (
    <a href={href} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

const mockData: ImportHistoryDetailData = {
  id: 1,
  course: { id: 10, level_name: "基礎英語" },
  unit: { id: 100, unit_name: "単元1" },
  user: { id: 1000, name: "実行太郎" },
  file_name: "questions.csv",
  status: "completed",
  mode: "append",
  total_count: 10,
  success_count: 8,
  error_count: 2,
  started_at: "2026-08-01T10:00:00+09:00",
  finished_at: "2026-08-01T10:05:00+09:00",
  created_at: "2026-08-01T10:00:00+09:00",
  errors: [
    { row_number: 3, message: "問題文は必須です" },
    { row_number: 5, message: "選択肢が不足しています" },
  ],
  warnings: [],
};

const defaultProps = {
  data: mockData,
  activeTab: "errors" as const,
  exporting: false,
  snackbar: { open: false, message: "", severity: "success" as const },
  onTabChange: vi.fn(),
  onExport: vi.fn(),
  onSnackbarClose: vi.fn(),
};

describe("ImportHistoryDetailPresenter", () => {
  describe("サマリー", () => {
    it("コース・単元・ファイル名・実行者が表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(screen.getByText("基礎英語")).toBeInTheDocument();
      expect(screen.getByText("単元1")).toBeInTheDocument();
      expect(screen.getByText("questions.csv")).toBeInTheDocument();
      expect(screen.getByText("実行太郎")).toBeInTheDocument();
    });

    it("件数が総数・成功数・エラー数で表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
    });

    it("モードが日本語ラベルで表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(screen.getByText("追加")).toBeInTheDocument();
    });

    it("日時が yyyy/MM/dd HH:mm 形式で表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(screen.getByText("2026/08/01 10:00")).toBeInTheDocument();
    });

    it("ステータスがChipで表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(screen.getByText("完了")).toBeInTheDocument();
    });

    it("ステータスが失敗のときは「失敗」が表示される", () => {
      render(
        <Presenter
          {...defaultProps}
          data={{ ...mockData, status: "failed" }}
        />,
      );
      expect(screen.getByText("失敗")).toBeInTheDocument();
    });

    it("コース・単元・実行者がnullのときは「-」が表示される", () => {
      render(
        <Presenter
          {...defaultProps}
          data={{ ...mockData, course: null, unit: null, user: null }}
        />,
      );
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("タブ", () => {
    it("エラー・警告・成功の3タブが表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(screen.getByRole("tab", { name: /エラー/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /警告/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /成功/ })).toBeInTheDocument();
    });

    it("タブのラベルに件数が表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(
        screen.getByRole("tab", { name: "エラー (2)" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "警告 (0)" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "成功 (8)" })).toBeInTheDocument();
    });

    it("初期表示ではエラータブが選択されている", () => {
      render(<Presenter {...defaultProps} />);
      expect(screen.getByRole("tab", { name: /エラー/ })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("警告タブをクリックすると onTabChange が warnings で呼ばれる", () => {
      const onTabChange = vi.fn();
      render(<Presenter {...defaultProps} onTabChange={onTabChange} />);
      fireEvent.click(screen.getByRole("tab", { name: /警告/ }));
      expect(onTabChange).toHaveBeenCalledWith("warnings");
    });

    it("成功タブをクリックすると onTabChange が successes で呼ばれる", () => {
      const onTabChange = vi.fn();
      render(<Presenter {...defaultProps} onTabChange={onTabChange} />);
      fireEvent.click(screen.getByRole("tab", { name: /成功/ }));
      expect(onTabChange).toHaveBeenCalledWith("successes");
    });
  });

  describe("行一覧", () => {
    it("エラー行が行番号とメッセージで表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(screen.getByText("問題文は必須です")).toBeInTheDocument();
      expect(screen.getByText("選択肢が不足しています")).toBeInTheDocument();
    });

    it("エラーが0件のときは空状態が表示される", () => {
      render(
        <Presenter {...defaultProps} data={{ ...mockData, errors: [] }} />,
      );
      expect(
        screen.getByText("該当するデータがありません"),
      ).toBeInTheDocument();
    });

    it("警告タブが空のときは空状態が表示される", () => {
      render(<Presenter {...defaultProps} activeTab="warnings" />);
      expect(
        screen.getByText("該当するデータがありません"),
      ).toBeInTheDocument();
    });

    it("成功タブが空のときは空状態が表示される", () => {
      render(<Presenter {...defaultProps} activeTab="successes" />);
      expect(
        screen.getByText("該当するデータがありません"),
      ).toBeInTheDocument();
    });

    it("警告タブに切り替えるとエラー行は表示されない", () => {
      render(<Presenter {...defaultProps} activeTab="warnings" />);
      expect(screen.queryByText("問題文は必須です")).not.toBeInTheDocument();
    });

    it("テーブルヘッダーに「行番号」「メッセージ」が表示される", () => {
      render(<Presenter {...defaultProps} />);
      const headers = screen
        .getAllByRole("columnheader")
        .map((h) => h.textContent);
      expect(headers).toContain("行番号");
      expect(headers).toContain("メッセージ");
    });
  });

  describe("エクスポート", () => {
    it("エクスポートボタンのクリックで onExport が呼ばれる", () => {
      const onExport = vi.fn();
      render(<Presenter {...defaultProps} onExport={onExport} />);
      fireEvent.click(screen.getByRole("button", { name: /CSVエクスポート/ }));
      expect(onExport).toHaveBeenCalledTimes(1);
    });

    it("exporting が true のときボタンが無効になる", () => {
      render(<Presenter {...defaultProps} exporting />);
      expect(
        screen.getByRole("button", { name: /CSVエクスポート/ }),
      ).toBeDisabled();
    });
  });

  describe("ナビゲーション", () => {
    it("一覧へ戻るリンクが表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(
        screen.getByRole("link", { name: "インポート履歴一覧へ戻る" }),
      ).toHaveAttribute("href", "/admin/csv-import/history");
    });
  });

  describe("Snackbar", () => {
    it("snackbar.open が true のときメッセージが表示される", () => {
      render(
        <Presenter
          {...defaultProps}
          snackbar={{
            open: true,
            message: "CSVのダウンロードに失敗しました",
            severity: "error",
          }}
        />,
      );
      expect(
        screen.getByText("CSVのダウンロードに失敗しました"),
      ).toBeInTheDocument();
    });

    it("snackbar.open が false のときメッセージは表示されない", () => {
      render(<Presenter {...defaultProps} />);
      expect(
        screen.queryByText("CSVのダウンロードに失敗しました"),
      ).not.toBeInTheDocument();
    });
  });
});
