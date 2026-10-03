import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PaginationBar } from "./PaginationBar";

describe("PaginationBar", () => {
  it("totalPagesが1以下のとき何も描画しない", () => {
    const { container } = render(
      <PaginationBar totalPages={1} page={1} onChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("totalPagesが0のとき何も描画しない", () => {
    const { container } = render(
      <PaginationBar totalPages={0} page={1} onChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("totalPagesが2以上のときページネーションを描画する", () => {
    render(<PaginationBar totalPages={3} page={1} onChange={vi.fn()} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("ページをクリックするとonChangeが呼ばれる", () => {
    const onChange = vi.fn();
    render(<PaginationBar totalPages={3} page={1} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("現在のページがaria-currentになる", () => {
    render(<PaginationBar totalPages={3} page={2} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
