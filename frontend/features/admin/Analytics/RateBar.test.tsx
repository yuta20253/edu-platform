import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RateBar } from "./RateBar";

describe("RateBar", () => {
  it("割合を%付きで表示する", () => {
    render(<RateBar value={38.1} label="正答率" />);
    expect(screen.getByText("38.1%")).toBeVisible();
  });

  it("バーの値がアクセシビリティ属性に反映される", () => {
    render(<RateBar value={38.1} label="正答率" />);
    expect(screen.getByRole("progressbar", { name: "正答率" })).toHaveAttribute(
      "aria-valuenow",
      "38.1",
    );
  });

  it("0〜100の範囲外の値はバーの表示だけ丸める", () => {
    render(<RateBar value={120} label="正答率" />);
    expect(screen.getByRole("progressbar", { name: "正答率" })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(screen.getByText("120%")).toBeVisible();
  });
});
