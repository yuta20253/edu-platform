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
});
