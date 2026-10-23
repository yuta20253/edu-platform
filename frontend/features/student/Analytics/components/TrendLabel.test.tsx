import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrendLabel } from "./TrendLabel";

describe("TrendLabel", () => {
  it("「前期間比」と増減を表示する", () => {
    render(<TrendLabel trend={{ direction: "up", text: "+20pt" }} />);
    const label = screen.getByTestId("trend-label");
    expect(label).toHaveTextContent("前期間比");
    expect(label).toHaveTextContent("+20pt");
  });

  it.each(["up", "down", "flat", "none"] as const)(
    "増減の向き(%s)を data-direction に持つ",
    (direction) => {
      render(<TrendLabel trend={{ direction, text: "x" }} />);
      expect(screen.getByTestId("trend-label")).toHaveAttribute(
        "data-direction",
        direction,
      );
    },
  );

  it("上がったときは上向き、下がったときは下向きの矢印を出す", () => {
    const { rerender } = render(
      <TrendLabel trend={{ direction: "up", text: "+1pt" }} />,
    );
    expect(screen.getByTestId("ArrowUpwardIcon")).toBeInTheDocument();

    rerender(<TrendLabel trend={{ direction: "down", text: "-1pt" }} />);
    expect(screen.getByTestId("ArrowDownwardIcon")).toBeInTheDocument();
  });

  it("前期間なしのときは矢印を出さない", () => {
    render(<TrendLabel trend={{ direction: "none", text: "前期間なし" }} />);
    expect(screen.getByTestId("trend-label")).toHaveTextContent("前期間なし");
    expect(screen.queryByTestId("ArrowUpwardIcon")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ArrowDownwardIcon")).not.toBeInTheDocument();
  });
});
