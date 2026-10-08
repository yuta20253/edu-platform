import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Step3Confirm } from "./Step3Confirm";

const baseProps = {
  courseLabel: "標準レベル1",
  unitName: "二次関数",
  fileName: "questions.csv",
  mode: "append" as const,
  validCount: 5,
  totalCount: 5,
  submitting: false,
  submitError: null as string | null,
  onBack: vi.fn(),
  onSubmit: vi.fn(),
};

describe("Step3Confirm", () => {
  it("影響範囲のサマリが表示される", () => {
    render(<Step3Confirm {...baseProps} />);
    expect(screen.getByText("標準レベル1")).toBeInTheDocument();
    expect(screen.getByText("二次関数")).toBeInTheDocument();
    expect(screen.getByText("questions.csv")).toBeInTheDocument();
    expect(screen.getByText(/5.*\/.*5/)).toBeInTheDocument();
  });

  it("追加モードでは上書き警告は表示されない", () => {
    render(<Step3Confirm {...baseProps} mode="append" />);
    expect(screen.queryByText(/取り消せません/)).not.toBeInTheDocument();
  });

  it("上書きモードでは強い警告が表示される", () => {
    render(<Step3Confirm {...baseProps} mode="overwrite" />);
    expect(screen.getByText(/取り消せません/)).toBeInTheDocument();
  });

  it("submitting中は実行ボタンが無効になる", () => {
    render(<Step3Confirm {...baseProps} submitting />);
    expect(screen.getByRole("button", { name: /実行/ })).toBeDisabled();
  });

  it("submitErrorがあるとAlertが表示され再実行可能", () => {
    render(<Step3Confirm {...baseProps} submitError="失敗しました" />);
    expect(screen.getByText("失敗しました")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /実行/ })).toBeEnabled();
  });

  it("戻るボタンでonBackが呼ばれる", () => {
    const onBack = vi.fn();
    render(<Step3Confirm {...baseProps} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("実行ボタンでonSubmitが呼ばれる", () => {
    const onSubmit = vi.fn();
    render(<Step3Confirm {...baseProps} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: /実行/ }));
    expect(onSubmit).toHaveBeenCalled();
  });

  describe("上書きモードの確認ゲート", () => {
    it("実行ボタンを押しても確認ダイアログが開くだけで onSubmit は呼ばれない", () => {
      const onSubmit = vi.fn();
      render(
        <Step3Confirm {...baseProps} mode="overwrite" onSubmit={onSubmit} />,
      );

      fireEvent.click(screen.getByRole("button", { name: /実行/ }));

      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText("上書きインポートの確認")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "上書きして実行" }),
      ).toBeDisabled();
    });

    it("単元名を正確に入力すると実行でき、onSubmit が呼ばれる", () => {
      const onSubmit = vi.fn();
      render(
        <Step3Confirm {...baseProps} mode="overwrite" onSubmit={onSubmit} />,
      );
      fireEvent.click(screen.getByRole("button", { name: /実行/ }));

      fireEvent.change(screen.getByRole("textbox", { name: "単元名を入力" }), {
        target: { value: "別の単元" },
      });
      expect(
        screen.getByRole("button", { name: "上書きして実行" }),
      ).toBeDisabled();

      fireEvent.change(screen.getByRole("textbox", { name: "単元名を入力" }), {
        target: { value: "二次関数" },
      });
      fireEvent.click(screen.getByRole("button", { name: "上書きして実行" }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("キャンセルすると onSubmit は呼ばれずダイアログが閉じる", async () => {
      const onSubmit = vi.fn();
      render(
        <Step3Confirm {...baseProps} mode="overwrite" onSubmit={onSubmit} />,
      );
      fireEvent.click(screen.getByRole("button", { name: /実行/ }));

      const dialog = screen.getByRole("dialog");
      fireEvent.click(
        within(dialog).getByRole("button", { name: "キャンセル" }),
      );

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("追加モードでは確認ダイアログを挟まず onSubmit が呼ばれる", () => {
      const onSubmit = vi.fn();
      render(<Step3Confirm {...baseProps} mode="append" onSubmit={onSubmit} />);

      fireEvent.click(screen.getByRole("button", { name: /実行/ }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
