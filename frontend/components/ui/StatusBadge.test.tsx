import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge } from "./StatusBadge";

const definitions = {
  pending: { label: "待機中", color: "warning" },
  completed: { label: "完了", color: "success" },
};

describe("StatusBadge", () => {
  it("定義テーブルに一致するラベルが表示される", () => {
    render(<StatusBadge status="pending" definitions={definitions} />);
    expect(screen.getByText("待機中")).toBeInTheDocument();
  });

  it("MUIのcolorキーワードが指定された場合はcolorクラスが当たる", () => {
    render(<StatusBadge status="completed" definitions={definitions} />);
    expect(screen.getByText("完了").closest(".MuiChip-root")).toHaveClass(
      "MuiChip-colorSuccess",
    );
  });

  it("生の色コードが指定された場合はbgcolorで描画される", () => {
    render(
      <StatusBadge
        status="processing"
        definitions={{ processing: { label: "処理中", color: "#2563eb" } }}
      />,
    );
    expect(screen.getByText("処理中").closest(".MuiChip-root")).toHaveStyle({
      backgroundColor: "#2563eb",
    });
  });

  it("未知のstatusはデフォルトのフォールバックで「不明」と表示される", () => {
    render(<StatusBadge status="unknown_status" definitions={definitions} />);
    expect(screen.getByText("不明")).toBeInTheDocument();
  });

  it("フォールバックはカスタマイズできる", () => {
    render(
      <StatusBadge
        status="unknown_status"
        definitions={definitions}
        fallback={{ label: "その他", color: "info" }}
      />,
    );
    expect(screen.getByText("その他")).toBeInTheDocument();
  });

  it("variantを指定するとMUIのcolorキーワード表示に反映される", () => {
    render(
      <StatusBadge
        status="completed"
        definitions={definitions}
        variant="outlined"
      />,
    );
    expect(screen.getByText("完了").closest(".MuiChip-root")).toHaveClass(
      "MuiChip-outlined",
    );
  });

  it("クラッシュせずレンダリングできる(未知のstatus値による例外が発生しない)", () => {
    expect(() =>
      render(
        <StatusBadge
          status="totally_unexpected_value"
          definitions={definitions}
        />,
      ),
    ).not.toThrow();
  });
});
