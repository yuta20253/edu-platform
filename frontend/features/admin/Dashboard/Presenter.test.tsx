import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Presenter } from "./Presenter";
import type { DashboardData } from "./types";

const mockData: DashboardData = {
  stats: {
    student_count: 120,
    active_student_count: 87,
    teacher_count: 8,
    admin_count: 3,
    total_questions: 450,
    pending_student_count: 5,
    pending_teacher_count: 1,
  },
  recent_imports: [
    {
      id: 1,
      file_name: "mondai_q1.csv",
      status: "completed",
      success_count: 45,
      error_count: 0,
      total_count: 45,
      created_at: "2026-03-20T10:00:00.000Z",
    },
    {
      id: 2,
      file_name: "mondai_q2.csv",
      status: "failed",
      success_count: 0,
      error_count: 10,
      total_count: 10,
      created_at: "2026-03-19T09:00:00.000Z",
    },
  ],
  recent_announcements: [],
  meta: {
    active_student_period_days: 30,
    generated_at: "2026-03-20T12:00:00.000Z",
  },
};

describe("DashboardPresenter", () => {
  it("KPI: 生徒数が正しく表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("KPI: アクティブ生徒数が正しく表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("87")).toBeInTheDocument();
  });

  it("KPI: 教師数が正しく表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("KPI: 総問題数が正しく表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("450")).toBeInTheDocument();
  });

  it("KPI: 管理者数のカードは表示されない", () => {
    render(<Presenter data={mockData} />);
    expect(screen.queryByText("管理者数")).not.toBeInTheDocument();
  });

  it("CSVインポート履歴が表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("mondai_q1.csv")).toBeInTheDocument();
    expect(screen.getByText("mondai_q2.csv")).toBeInTheDocument();
  });

  it("completed ステータスのバッジが表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("完了")).toBeInTheDocument();
  });

  it("failed ステータスのバッジが表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("失敗")).toBeInTheDocument();
  });

  it("インポート履歴が空のとき空状態とCTAが表示される", () => {
    render(<Presenter data={{ ...mockData, recent_imports: [] }} />);
    expect(
      screen.getByText("まだCSVインポートを実行していません"),
    ).toBeInTheDocument();
    // クイックアクションにも同名のリンクがあるため複数ヒットする
    const links = screen.getAllByRole("link", {
      name: "CSVインポートを実行する",
    });
    expect(links.length).toBeGreaterThanOrEqual(1);
    links.forEach((link) =>
      expect(link).toHaveAttribute("href", "/admin/csv-import"),
    );
  });

  it("「すべて見る」リンクが履歴一覧ページを指す", () => {
    render(<Presenter data={mockData} />);
    // CSVインポート・お知らせ双方に同名リンクがあるため、対象のhrefを持つものを探す
    const links = screen.getAllByRole("link", { name: "すべて見る" });
    expect(
      links.some(
        (link) => link.getAttribute("href") === "/admin/csv-import/history",
      ),
    ).toBe(true);
  });

  it("最新お知らせが空のとき空状態とCTAが表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("お知らせがまだありません")).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "お知らせを作成する" });
    expect(links.length).toBeGreaterThanOrEqual(1);
    links.forEach((link) =>
      expect(link).toHaveAttribute("href", "/admin/notices/new"),
    );
  });

  it("最新お知らせがあるとタイトルとステータスバッジが表示される", () => {
    render(
      <Presenter
        data={{
          ...mockData,
          recent_announcements: [
            {
              id: 10,
              title: "夏季休業のお知らせ",
              status: "published",
              published_at: "2026-03-18T01:30:00.000Z",
              scheduled_at: null,
              created_at: "2026-03-17T00:00:00.000Z",
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("夏季休業のお知らせ")).toBeInTheDocument();
    expect(screen.getByText("配信済み")).toBeInTheDocument();
  });
});
