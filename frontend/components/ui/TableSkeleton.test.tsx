import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Table } from "@mui/material";
import { TableSkeleton } from "./TableSkeleton";

const renderWithTable = (props?: React.ComponentProps<typeof TableSkeleton>) =>
  render(
    <Table>
      <TableSkeleton {...props} />
    </Table>,
  );

describe("TableSkeleton", () => {
  it("デフォルトで5行4列のスケルトンセルを描画する", () => {
    renderWithTable();
    expect(screen.getAllByRole("row")).toHaveLength(5);
    expect(document.querySelectorAll(".MuiSkeleton-root")).toHaveLength(20);
  });

  it("rows/columnsを指定するとその件数だけ描画する", () => {
    renderWithTable({ rows: 3, columns: 2 });
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(document.querySelectorAll(".MuiSkeleton-root")).toHaveLength(6);
  });
});
