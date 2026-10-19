import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AsyncBoundary } from "./AsyncBoundary";

describe("AsyncBoundary", () => {
  it("errorがあればエラー表示になる", () => {
    render(
      <AsyncBoundary data={null} error={true}>
        {() => <div>成功</div>}
      </AsyncBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("成功")).not.toBeInTheDocument();
  });

  it("dataがあってもerrorがあればエラー表示を優先する", () => {
    render(
      <AsyncBoundary data={{ name: "a" }} error={true}>
        {() => <div>成功</div>}
      </AsyncBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("成功")).not.toBeInTheDocument();
  });

  it("onRetryを渡すと再試行ボタンが表示されクリックで呼ばれる", () => {
    const onRetry = vi.fn();
    render(
      <AsyncBoundary data={null} error={true} onRetry={onRetry}>
        {() => <div>成功</div>}
      </AsyncBoundary>,
    );
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("onRetryを渡さない場合は再試行ボタンが表示されない", () => {
    render(
      <AsyncBoundary data={null} error={true}>
        {() => <div>成功</div>}
      </AsyncBoundary>,
    );
    expect(
      screen.queryByRole("button", { name: "再試行" }),
    ).not.toBeInTheDocument();
  });
});
