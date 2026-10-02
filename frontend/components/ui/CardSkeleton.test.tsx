import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CardSkeleton } from "./CardSkeleton";

describe("CardSkeleton", () => {
  it("デフォルトで3行分のスケルトンを描画する", () => {
    render(<CardSkeleton />);
    expect(document.querySelectorAll(".MuiSkeleton-root")).toHaveLength(3);
  });

  it("linesを指定するとその行数だけ描画する", () => {
    render(<CardSkeleton lines={5} />);
    expect(document.querySelectorAll(".MuiSkeleton-root")).toHaveLength(5);
  });
});
