import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubjectProgressCard } from "./SubjectProgressCard";

const card = () => screen.getByRole("region", { name: "科目別進捗" });
const row = (subjectName: string) =>
  screen.getByRole("listitem", { name: subjectName });

const subjectProgress = [
  { subject_name: "英語", correct_rate: { current: 62.5, previous: 55 } },
  { subject_name: "数学", correct_rate: { current: 40, previous: null } },
];

describe("SubjectProgressCard", () => {
  it("科目ごとに期間内の正答率を表示する", () => {
    render(<SubjectProgressCard subjectProgress={subjectProgress} />);
    expect(row("英語")).toHaveTextContent("62.5%");
    expect(row("数学")).toHaveTextContent("40%");
  });

  it("科目ごとに正答率のバーを表示する", () => {
    render(<SubjectProgressCard subjectProgress={subjectProgress} />);
    expect(within(row("英語")).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "63",
    );
  });

  it("科目ごとに前期間比を表示する", () => {
    render(<SubjectProgressCard subjectProgress={subjectProgress} />);
    expect(within(row("英語")).getByTestId("trend-label")).toHaveTextContent(
      "+7.5pt",
    );
  });

  it("前期間にその科目の解答が無いときは「前期間なし」と表示する", () => {
    render(<SubjectProgressCard subjectProgress={subjectProgress} />);
    expect(within(row("数学")).getByTestId("trend-label")).toHaveTextContent(
      "前期間なし",
    );
  });

  it("何を集計しているかを表示する", () => {
    render(<SubjectProgressCard subjectProgress={subjectProgress} />);
    expect(card()).toHaveTextContent("期間内に解いた問題の正答率");
  });

  it("期間内の解答が無いときはその旨を表示する", () => {
    render(<SubjectProgressCard subjectProgress={[]} />);
    expect(card()).toHaveTextContent("この期間に解いた問題はありません");
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
