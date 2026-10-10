import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ConfirmPresenter } from "./ConfirmPresenter";
import { AccountLinkPreview } from "./types";

const basePreview: AccountLinkPreview = {
  high_school_name: "北海道札幌西高等学校",
  grade_display_name: "高1生",
  school_class_name: "A組",
};

describe("ConfirmPresenter", () => {
  it("学校・学年・学級を含む確認メッセージが表示される", () => {
    render(
      <ConfirmPresenter
        preview={basePreview}
        errorMessage=""
        onConfirm={vi.fn()}
        onBack={vi.fn()}
        disabled={false}
      />,
    );

    expect(
      screen.getByText(
        "北海道札幌西高等学校 高1生 A組 に紐付けます。よろしいですか?",
      ),
    ).toBeInTheDocument();
  });

  it("学級が未設定の場合は学級部分を省略する", () => {
    render(
      <ConfirmPresenter
        preview={{ ...basePreview, school_class_name: null }}
        errorMessage=""
        onConfirm={vi.fn()}
        onBack={vi.fn()}
        disabled={false}
      />,
    );

    expect(
      screen.getByText(
        "北海道札幌西高等学校 高1生 に紐付けます。よろしいですか?",
      ),
    ).toBeInTheDocument();
  });

  it("「はい、紐付ける」を押すとonConfirmが呼ばれる", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmPresenter
        preview={basePreview}
        errorMessage=""
        onConfirm={onConfirm}
        onBack={vi.fn()}
        disabled={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "はい、紐付ける" }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("「戻る」を押すとonBackが呼ばれる", () => {
    const onBack = vi.fn();
    render(
      <ConfirmPresenter
        preview={basePreview}
        errorMessage=""
        onConfirm={vi.fn()}
        onBack={onBack}
        disabled={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("errorMessageが渡されるとAlertが表示される", () => {
    render(
      <ConfirmPresenter
        preview={basePreview}
        errorMessage="既に紐付けられています"
        onConfirm={vi.fn()}
        onBack={vi.fn()}
        disabled={false}
      />,
    );

    expect(screen.getByText("既に紐付けられています")).toBeInTheDocument();
  });

  it("disabledがtrueのとき両方のボタンがdisabledになる(送信中・紐付け済みの遷移待ちを含む)", () => {
    render(
      <ConfirmPresenter
        preview={basePreview}
        errorMessage=""
        onConfirm={vi.fn()}
        onBack={vi.fn()}
        disabled={true}
      />,
    );

    expect(
      screen.getByRole("button", { name: "はい、紐付ける" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "戻る" })).toBeDisabled();
  });
});
