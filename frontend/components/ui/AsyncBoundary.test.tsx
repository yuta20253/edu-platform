import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
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
});
