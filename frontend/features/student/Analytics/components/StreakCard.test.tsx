import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StreakCard } from "./StreakCard";

const card = () => screen.getByRole("region", { name: "連続学習日数" });

describe("StreakCard", () => {
  it("連続学習日数を表示する", () => {
    render(<StreakCard streakDays={5} />);
    expect(card()).toHaveTextContent("5日");
  });

  it("0日のときも0日と表示する", () => {
    render(<StreakCard streakDays={0} />);
    expect(card()).toHaveTextContent("0日");
  });

  it("期間の選択とは関係ないことを表示する", () => {
    render(<StreakCard streakDays={5} />);
    expect(card()).toHaveTextContent(
      "期間に関係なく、毎日続けて学習している日数",
    );
  });
});
