import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("スピナーを使わない(role=progressbarが存在しない)", () => {
    const { queryByRole } = render(<Skeleton />);
    expect(queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("KPIカード4枚分のスケルトンを表示する", () => {
    const { getAllByTestId } = render(<Skeleton />);
    expect(getAllByTestId("kpi-card-skeleton")).toHaveLength(4);
  });

  it("CSVインポートテーブル5行分のスケルトンを表示する", () => {
    const { getAllByTestId } = render(<Skeleton />);
    expect(getAllByTestId("import-row-skeleton")).toHaveLength(5);
  });

  it("お知らせ3件分のスケルトンを表示する", () => {
    const { getAllByTestId } = render(<Skeleton />);
    expect(getAllByTestId("announcement-row-skeleton")).toHaveLength(3);
  });
});
