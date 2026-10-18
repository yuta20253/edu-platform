import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PeriodChips } from "./PeriodChips";

const defaultProps = {
  period: { from: "", to: "" },
  onChange: vi.fn(),
  validationErrors: [] as string[],
};

const chip = (name: string) => screen.getByRole("button", { name });

describe("PeriodChips", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // プリセットの期間は今日基準で決まるため 2026-10-18 に固定する
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 18));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("7日間 / 30日間 / 90日間のチップを表示する", () => {
    render(<PeriodChips {...defaultProps} />);
    expect(chip("7日間")).toBeVisible();
    expect(chip("30日間")).toBeVisible();
    expect(chip("90日間")).toBeVisible();
  });

  it("期間が未指定のときは既定の7日間を選択状態にする", () => {
    render(<PeriodChips {...defaultProps} />);
    expect(chip("7日間")).toHaveAttribute("aria-pressed", "true");
    expect(chip("30日間")).toHaveAttribute("aria-pressed", "false");
    expect(chip("90日間")).toHaveAttribute("aria-pressed", "false");
  });

  it("プリセットと一致する期間ならそのチップを選択状態にする", () => {
    render(
      <PeriodChips
        {...defaultProps}
        period={{ from: "2026-09-19", to: "2026-10-18" }}
      />,
    );
    expect(chip("30日間")).toHaveAttribute("aria-pressed", "true");
    expect(chip("7日間")).toHaveAttribute("aria-pressed", "false");
  });

  it("どのプリセットとも一致しない期間ならどのチップも選択しない", () => {
    render(
      <PeriodChips
        {...defaultProps}
        period={{ from: "2026-10-01", to: "2026-10-18" }}
      />,
    );
    expect(chip("7日間")).toHaveAttribute("aria-pressed", "false");
    expect(chip("30日間")).toHaveAttribute("aria-pressed", "false");
    expect(chip("90日間")).toHaveAttribute("aria-pressed", "false");
  });

  it("サーバー描画ではどのチップも選択状態にしない(ハイドレーション不一致を防ぐ)", () => {
    const html = renderToString(<PeriodChips {...defaultProps} />);
    expect(html).not.toContain('aria-pressed="true"');
  });

  it("チップを押すと今日を含む期間を onChange に渡す", () => {
    const onChange = vi.fn();
    render(<PeriodChips {...defaultProps} onChange={onChange} />);

    fireEvent.click(chip("90日間"));

    expect(onChange).toHaveBeenCalledWith({
      from: "2026-07-21",
      to: "2026-10-18",
    });
  });

  it("選択中のチップを押しても onChange を呼ばない(同じ期間を取得し直さない)", () => {
    const onChange = vi.fn();
    render(<PeriodChips {...defaultProps} onChange={onChange} />);

    fireEvent.click(chip("7日間"));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("検証メッセージがあればチップの直下に表示する", () => {
    render(
      <PeriodChips
        {...defaultProps}
        validationErrors={["取得期間は366日以内で指定してください"]}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "取得期間は366日以内で指定してください",
    );
  });

  it("検証メッセージが無いときはエラーを表示しない", () => {
    render(<PeriodChips {...defaultProps} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
