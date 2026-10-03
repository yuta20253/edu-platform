import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("messageが表示される", () => {
    render(<EmptyState message="データが見つかりません" />);
    expect(screen.getByText("データが見つかりません")).toBeInTheDocument();
  });

  it("デフォルトのpyは6", () => {
    render(<EmptyState message="データが見つかりません" />);
    expect(screen.getByTestId("empty-state")).toHaveStyle({
      paddingTop: "48px",
      paddingBottom: "48px",
    });
  });

  it("pyを指定すると反映される", () => {
    render(<EmptyState message="データが見つかりません" py={4} />);
    expect(screen.getByTestId("empty-state")).toHaveStyle({
      paddingTop: "32px",
      paddingBottom: "32px",
    });
  });

  it("actionを渡すと表示される", () => {
    render(
      <EmptyState
        message="データが見つかりません"
        action={<button type="button">再試行</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "再試行" })).toBeInTheDocument();
  });

  it("actionを渡さない場合はボタンが表示されない", () => {
    render(<EmptyState message="データが見つかりません" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("onClickが指定されたactionのクリックを処理できる", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        message="データが見つかりません"
        action={
          <button type="button" onClick={onClick}>
            再試行
          </button>
        }
      />,
    );
    screen.getByRole("button", { name: "再試行" }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
