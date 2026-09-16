import { Table, TableBody, TableCell, TableRow } from "@mui/material";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableCard } from "./TableCard";

const renderWithTable = (density?: "default" | "compact") =>
  render(
    <TableCard density={density}>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>1行目</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>2行目</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>3行目</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableCard>,
  );

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

  // compact のスタイルは子孫セレクタで当てているため、実際に効いているかを
  // テーブルを描画して確認する。ホバーは happy-dom が :hover を再現しないため
  // 検証できない（実装側でゼブラ縞より詳細度を高くしてある）。
  describe('density="compact"', () => {
    it("カードの角丸が落ちる", () => {
      renderWithTable("compact");
      expect(screen.getByTestId("table-card")).toHaveStyle({
        borderRadius: "0px",
      });
    });

    it("偶数行にゼブラ縞が付く", () => {
      renderWithTable("compact");
      const rows = screen.getAllByRole("row");
      expect(rows[1]).toHaveStyle({ backgroundColor: "#f8fafc" });
    });

    it("奇数行にはゼブラ縞が付かない", () => {
      renderWithTable("compact");
      const rows = screen.getAllByRole("row");
      expect(rows[0]).not.toHaveStyle({ backgroundColor: "#f8fafc" });
      expect(rows[2]).not.toHaveStyle({ backgroundColor: "#f8fafc" });
    });

    it("最終行のセルだけ下線が消える", () => {
      renderWithTable("compact");
      const rows = screen.getAllByRole("row");
      expect(rows[0].querySelector("td")).toHaveStyle({
        borderBottomWidth: "1px",
      });
      expect(rows[2].querySelector("td")).toHaveStyle({
        borderBottomWidth: "0px",
      });
    });
  });

  describe('density="default"', () => {
    it("角丸が付き、ゼブラ縞は付かない", () => {
      renderWithTable();
      expect(screen.getByTestId("table-card")).toHaveStyle({
        borderRadius: "8px",
      });
      expect(screen.getAllByRole("row")[1]).not.toHaveStyle({
        backgroundColor: "#f8fafc",
      });
    });
  });
});
