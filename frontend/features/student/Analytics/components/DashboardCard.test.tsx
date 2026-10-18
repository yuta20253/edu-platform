import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardCard } from "./DashboardCard";

describe("DashboardCard", () => {
  it("見出しを持つ領域として中身を表示する", () => {
    render(
      <DashboardCard title="連続学習日数">
        <p>5日</p>
      </DashboardCard>,
    );
    const card = screen.getByRole("region", { name: "連続学習日数" });
    expect(card).toHaveTextContent("5日");
  });

  it("見出しは h2 で表示する", () => {
    render(<DashboardCard title="学習時間">{null}</DashboardCard>);
    expect(
      screen.getByRole("heading", { level: 2, name: "学習時間" }),
    ).toBeInTheDocument();
  });
});
