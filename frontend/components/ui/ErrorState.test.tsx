import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  it("デフォルトメッセージが表示される", () => {
    render(<ErrorState />);
    expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();
  });

  it("messageを指定すると上書きできる", () => {
    render(<ErrorState message="お知らせが見つかりませんでした" />);
    expect(
      screen.getByText("お知らせが見つかりませんでした"),
    ).toBeInTheDocument();
  });

  it("onRetryを渡すと再試行ボタンが表示されクリックで呼ばれる", () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("onRetryを渡さない場合は再試行ボタンが表示されない", () => {
    render(<ErrorState />);
    expect(
      screen.queryByRole("button", { name: "再試行" }),
    ).not.toBeInTheDocument();
  });

  it("エラー表示のAlertとして描画される", () => {
    render(<ErrorState />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
