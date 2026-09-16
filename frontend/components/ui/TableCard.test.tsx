import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableCard } from "./TableCard";

describe("TableCard", () => {
  it("children をそのまま描画する", () => {
    render(
      <TableCard>
        <div>テーブル本体</div>
      </TableCard>,
    );
    expect(screen.getByText("テーブル本体")).toBeInTheDocument();
  });

  it("density を指定しないと default になる", () => {
    render(
      <TableCard>
        <div>テーブル本体</div>
      </TableCard>,
    );
    expect(screen.getByTestId("table-card")).toHaveAttribute(
      "data-density",
      "default",
    );
  });

  it('density="compact" を指定すると compact になる', () => {
    render(
      <TableCard density="compact">
        <div>テーブル本体</div>
      </TableCard>,
    );
    expect(screen.getByTestId("table-card")).toHaveAttribute(
      "data-density",
      "compact",
    );
  });
});
