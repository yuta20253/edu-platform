import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Presenter } from "../Presenter";
import type { AdminUnitDetail } from "../types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockUnit: AdminUnitDetail = {
  id: 11,
  course_id: 7,
  unit_name: "二次関数",
  course: {
    id: 7,
    subject: { id: 1, name: "数学" },
    level_name: "標準",
    level_number: 2,
  },
  questions: [
    {
      id: 101,
      question_text: "頂点の座標を求めよ",
      correct_answer: "(1, -2)",
      choices: [
        { id: 1, choice_number: 1, choice_text: "(1, -2)" },
        { id: 2, choice_number: 2, choice_text: "(-1, 2)" },
      ],
      hints: [{ id: 1, step_number: 1, hint_text: "平方完成してみよう" }],
      explanations: [
        {
          id: 1,
          explanation_type: "基本解説",
          explanation_text: "y = (x-1)^2 - 2 に変形する",
        },
      ],
    },
  ],
  recent_import_histories: [
    {
      id: 501,
      file_name: "questions_2024.csv",
      status: "completed",
      success_count: 10,
      error_count: 0,
      total_count: 10,
      created_at: "2026-06-01T10:30:00.000Z",
    },
    {
      id: 502,
      file_name: "questions_failed.csv",
      status: "failed",
      success_count: 0,
      error_count: 3,
      total_count: 3,
      created_at: "2026-06-02T11:00:00.000Z",
    },
  ],
};

describe("AdminUnitDetailPresenter", () => {
  it("単元名がタイトルとして表示される", () => {
    render(<Presenter unit={mockUnit} courseId={7} />);
    expect(screen.getAllByText("二次関数").length).toBeGreaterThan(0);
  });

  it("パンくずに講座一覧・講座名リンクがある", () => {
    render(<Presenter unit={mockUnit} courseId={7} />);
    expect(screen.getByRole("link", { name: "講座一覧" })).toHaveAttribute(
      "href",
      "/admin/courses",
    );
    // 「講座詳細」固定文言ではなく、実際の講座名（レベル）を表示する
    const courseLink = screen.getByRole("link", {
      name: "標準レベル2",
    });
    expect(courseLink).toHaveAttribute("href", "/admin/courses/7");
  });

  it("上部の「CSVで問題を追加」ボタンが正しい href を持つ", () => {
    render(<Presenter unit={mockUnit} courseId={7} />);
    const link = screen.getByRole("link", { name: /CSVで問題を追加/ });
    expect(link).toHaveAttribute("href", "/admin/courses/7/units/11/import");
  });

  it("問題文がアコーディオン見出しに表示される", () => {
    render(<Presenter unit={mockUnit} courseId={7} />);
    expect(
      screen.getByRole("button", { name: /頂点の座標を求めよ/ }),
    ).toBeInTheDocument();
  });

  it("アコーディオンを展開すると選択肢・ヒント・解説が表示される", () => {
    render(<Presenter unit={mockUnit} courseId={7} />);
    fireEvent.click(screen.getByRole("button", { name: /頂点の座標を求めよ/ }));
    expect(screen.getByText("2. (-1, 2)")).toBeInTheDocument();
    expect(
      screen.getByText("ステップ1: 平方完成してみよう"),
    ).toBeInTheDocument();
    expect(screen.getByText("y = (x-1)^2 - 2 に変形する")).toBeInTheDocument();
    expect(screen.getByText("基本解説")).toBeInTheDocument();
  });

  it("インポート履歴のファイル名と件数・ステータスが表示される", () => {
    render(<Presenter unit={mockUnit} courseId={7} />);
    const completedRow = screen
      .getByText("questions_2024.csv")
      .closest("tr") as HTMLElement;
    expect(within(completedRow).getByText("完了")).toBeInTheDocument();

    const failedRow = screen
      .getByText("questions_failed.csv")
      .closest("tr") as HTMLElement;
    expect(within(failedRow).getByText("失敗")).toBeInTheDocument();
  });

  it("問題が0件のとき空状態バナーと追加CTAが表示される", () => {
    render(<Presenter unit={{ ...mockUnit, questions: [] }} courseId={7} />);
    expect(screen.getByText(/まだ問題がありません/)).toBeInTheDocument();
    // 空状態でも CSV 追加導線が存在する
    expect(
      screen.getAllByRole("link", { name: /CSVで問題を追加/ }).length,
    ).toBeGreaterThan(0);
  });

  it("インポート履歴が0件のとき空メッセージが表示される", () => {
    render(
      <Presenter
        unit={{ ...mockUnit, recent_import_histories: [] }}
        courseId={7}
      />,
    );
    expect(screen.getByText("インポート履歴はありません")).toBeInTheDocument();
  });
});
