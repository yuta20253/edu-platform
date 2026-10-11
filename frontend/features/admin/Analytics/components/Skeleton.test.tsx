import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnalyticsSkeleton } from "./Skeleton";

describe("AnalyticsSkeleton", () => {
  it("KPIカード4枚分の骨格を表示する", () => {
    render(<AnalyticsSkeleton />);
    expect(screen.getAllByTestId("analytics-skeleton-kpi")).toHaveLength(4);
  });

  it("グラフ・ランキング2枚・テーブルの骨格を表示する", () => {
    render(<AnalyticsSkeleton />);
    expect(screen.getByTestId("analytics-skeleton-chart")).toBeVisible();
    expect(screen.getAllByTestId("analytics-skeleton-ranking")).toHaveLength(2);
    expect(screen.getByTestId("analytics-skeleton-table")).toBeVisible();
  });

  it("テーブルの骨格は共通のTableSkeleton(行・列のグリッド)を使う", () => {
    render(<AnalyticsSkeleton />);
    expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
  });

  it("スピナー(progressbar)は使わない", () => {
    render(<AnalyticsSkeleton />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("読み込み中であることを支援技術に伝える", () => {
    render(<AnalyticsSkeleton />);
    expect(screen.getByLabelText("読み込み中")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });
});
