import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LowAccuracyRanking } from "./LowAccuracyRanking";
import type { LowAccuracyQuestion, LowAccuracyUnit } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const units: LowAccuracyUnit[] = [
  {
    unit_id: 12,
    unit_name: "二次関数",
    course_id: 3,
    course_name: "数学I",
    subject_name: "数学",
    answer_count: 420,
    accuracy_rate: 38.1,
  },
  {
    unit_id: 20,
    unit_name: "三角比",
    course_id: 3,
    course_name: "数学I",
    subject_name: "数学",
    answer_count: 100,
    accuracy_rate: 45,
  },
];

const questions: LowAccuracyQuestion[] = [
  {
    question_id: 881,
    question_text: "二次関数 y=ax^2+bx+c のグラフの頂点を求めなさい",
    unit_id: 12,
    unit_name: "二次関数",
    course_id: 3,
    answer_count: 96,
    accuracy_rate: 22.9,
  },
];

const renderRanking = (overrides = {}) =>
  render(
    <LowAccuracyRanking
      units={units}
      questions={questions}
      minAnswerCount={20}
      {...overrides}
    />,
  );

const unitCard = () =>
  screen.getByRole("region", { name: "正答率が低い単元 ワースト10" });
const questionCard = () =>
  screen.getByRole("region", { name: "正答率が低い設問 ワースト10" });

describe("LowAccuracyRanking", () => {
  it("単元・設問の2つのカードを表示する", () => {
    renderRanking();
    expect(unitCard()).toBeVisible();
    expect(questionCard()).toBeVisible();
  });

  it("各カードに集計対象の最小解答数の注釈を出す", () => {
    renderRanking({ minAnswerCount: 20 });
    expect(
      within(unitCard()).getByText("解答数20件以上の単元のみ集計"),
    ).toBeVisible();
    expect(
      within(questionCard()).getByText("解答数20件以上の設問のみ集計"),
    ).toBeVisible();
  });

  it("注釈の件数は meta.min_answer_count の値に追従する", () => {
    renderRanking({ minAnswerCount: 50 });
    expect(
      within(unitCard()).getByText("解答数50件以上の単元のみ集計"),
    ).toBeVisible();
  });

  it("単元ランキングに単元名・講座名・解答数・正答率を表示する", () => {
    renderRanking();
    const card = unitCard();
    expect(within(card).getByText("二次関数")).toBeVisible();
    expect(within(card).getAllByText("数学I")[0]).toBeVisible();
    expect(within(card).getByText("420件")).toBeVisible();
    expect(within(card).getByText("38.1%")).toBeVisible();
  });

  it("単元の行は該当単元の詳細画面へのリンクになる", () => {
    renderRanking();
    expect(
      within(unitCard()).getByRole("link", { name: /二次関数/ }),
    ).toHaveAttribute("href", "/admin/courses/3/units/12");
  });

  it("単元ランキングは渡された順(正答率の昇順)のまま表示する", () => {
    renderRanking();
    const links = within(unitCard()).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/admin/courses/3/units/12",
      "/admin/courses/3/units/20",
    ]);
  });

  it("設問ランキングに設問文・単元名・解答数・正答率を表示する", () => {
    renderRanking();
    const card = questionCard();
    expect(
      within(card).getByText("二次関数 y=ax^2+bx+c のグラフの頂点を求めなさい"),
    ).toBeVisible();
    expect(within(card).getByText("二次関数")).toBeVisible();
    expect(within(card).getByText("96件")).toBeVisible();
    expect(within(card).getByText("22.9%")).toBeVisible();
  });

  it("設問の行は該当単元の詳細画面へのリンクになる", () => {
    renderRanking();
    expect(within(questionCard()).getByRole("link")).toHaveAttribute(
      "href",
      "/admin/courses/3/units/12",
    );
  });

  it("設問文は1行で省略表示する(noWrap)", () => {
    renderRanking();
    const text = within(questionCard()).getByText(
      "二次関数 y=ax^2+bx+c のグラフの頂点を求めなさい",
    );
    expect(text).toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("単元が0件のときは空状態を表示する", () => {
    renderRanking({ units: [] });
    expect(
      within(unitCard()).getByText("対象期間に十分な解答データがありません"),
    ).toBeVisible();
  });

  it("設問が0件のときは空状態を表示する", () => {
    renderRanking({ questions: [] });
    expect(
      within(questionCard()).getByText(
        "対象期間に十分な解答データがありません",
      ),
    ).toBeVisible();
  });

  it("空状態でも集計対象の注釈は表示する", () => {
    renderRanking({ units: [] });
    expect(
      within(unitCard()).getByText("解答数20件以上の単元のみ集計"),
    ).toBeVisible();
  });
});
