import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RankContent } from "./RankContent";

const baseProps = {
  type: "course_rank" as const,
  selected: true,
  data: null,
  error: false,
  onRetry: vi.fn(),
};

describe("RankContent(順位)", () => {
  it("コース内順位でコース未選択の場合は案内メッセージを表示する", () => {
    render(<RankContent {...baseProps} selected={false} />);
    expect(
      screen.getByText("教科とコースを選択してください"),
    ).toBeInTheDocument();
  });

  it("単元内順位で単元未選択の場合は案内メッセージを表示する", () => {
    render(<RankContent {...baseProps} type="unit_rank" selected={false} />);
    expect(
      screen.getByText("コースと単元を選択してください"),
    ).toBeInTheDocument();
  });

  it("選択が揃っていて data がない間はローディングを表示する", () => {
    render(<RankContent {...baseProps} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("取得に失敗したときはこのセクションにエラーを出し、再試行できる", async () => {
    const onRetry = vi.fn();
    render(<RankContent {...baseProps} error onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("順位のデータが渡されると順位を表示する", () => {
    render(<RankContent {...baseProps} data={{ rank: 3, total_users: 30 }} />);
    expect(screen.getByText("30人中 3位")).toBeInTheDocument();
  });
});
