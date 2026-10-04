import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityChart } from "./ActivityChart";
import type { DailyActivity } from "./types";

const daily: DailyActivity[] = [
  {
    date: "2026-09-29",
    active_student_count: 40,
    answer_count: 380,
    accuracy_rate: 67.2,
  },
  {
    date: "2026-09-30",
    active_student_count: 42,
    answer_count: 400,
    accuracy_rate: 70,
  },
];

describe("ActivityChart", () => {
  it("見出しを表示する", () => {
    render(<ActivityChart data={daily} />);
    expect(screen.getByText("日別の学習推移")).toBeVisible();
  });

  it("データがあるときはグラフ(svg)を描画する", () => {
    const { container } = render(<ActivityChart data={daily} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("データが空のときは空状態を表示し、グラフは描画しない", () => {
    const { container } = render(<ActivityChart data={[]} />);
    expect(screen.getByText("対象期間にデータがありません")).toBeVisible();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("正答率トグルは初期状態でOFF", () => {
    render(<ActivityChart data={daily} />);
    expect(
      screen.getByRole("button", { name: "正答率を表示" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("正答率トグルをクリックするとON/OFFが切り替わる", () => {
    render(<ActivityChart data={daily} />);
    const toggle = screen.getByRole("button", { name: "正答率を表示" });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
