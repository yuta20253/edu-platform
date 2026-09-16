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

  it("下余白は既定で 24px (MUI spacing 3) になる", () => {
    render(
      <TableCard>
        <div>テーブル本体</div>
      </TableCard>,
    );
    expect(screen.getByTestId("table-card")).toHaveStyle({
      marginBottom: "24px",
    });
  });

  it("mb を指定すると下余白が変わる", () => {
    render(
      <TableCard mb={0}>
        <div>テーブル本体</div>
      </TableCard>,
    );
    expect(screen.getByTestId("table-card")).toHaveStyle({
      marginBottom: "0px",
    });
  });
});
