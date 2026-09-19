import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RankChart } from "./RankChart";

describe("RankChart", () => {
  it("順位と総人数を表示する", () => {
    render(<RankChart data={{ rank: 3, total_users: 30 }} />);
    expect(screen.getByText("30人中 3位")).toBeInTheDocument();
  });

  it("rankがnullの場合は案内メッセージを表示する", () => {
    render(<RankChart data={{ rank: null, total_users: 10 }} />);
    expect(
      screen.getByText("対象の学習履歴がまだありません(全10人中)"),
    ).toBeInTheDocument();
  });
});
