import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AccountLink } from "./index";
import { AccountLinkPreview } from "./types";

const onPreviewSubmitMock = vi.fn();
const onConfirmMock = vi.fn();
const onBackMock = vi.fn();

type MockState = {
  step: "input" | "confirm";
  previewError: string;
  preview: AccountLinkPreview | null;
  confirmError: string;
  confirming: boolean;
  isLinked: boolean;
};

let mockState: MockState;

vi.mock("./hooks/useAccountLink", () => ({
  useAccountLink: () => ({
    step: mockState.step,
    onPreviewSubmit: onPreviewSubmitMock,
    previewError: mockState.previewError,
    preview: mockState.preview,
    onBack: onBackMock,
    onConfirm: onConfirmMock,
    confirmError: mockState.confirmError,
    confirming: mockState.confirming,
    isLinked: mockState.isLinked,
  }),
}));

describe("AccountLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      step: "input",
      previewError: "",
      preview: null,
      confirmError: "",
      confirming: false,
      isLinked: false,
    };
  });

  it("入力して送信するとonPreviewSubmitが正しい値で呼ばれる", async () => {
    render(<AccountLink />);

    fireEvent.change(
      screen.getByPlaceholderText("生徒コードを入力してください"),
      {
        target: { value: "AB12-CD3456" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    await waitFor(() =>
      expect(onPreviewSubmitMock).toHaveBeenCalledWith(
        { student_number: "AB12-CD3456" },
        expect.anything(),
      ),
    );
  });

  it("stepがconfirmのとき確認画面を表示し、確定・戻るの操作をフックへ繋ぐ", () => {
    mockState.step = "confirm";
    mockState.preview = {
      high_school_name: "北海道札幌西高等学校",
      grade_display_name: "高1生",
      school_class_name: "A組",
    };
    render(<AccountLink />);

    expect(
      screen.getByText(
        "北海道札幌西高等学校 高1生 A組 に紐付けます。よろしいですか?",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "はい、紐付ける" }));
    expect(onConfirmMock).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(onBackMock).toHaveBeenCalled();
  });

  it("確認画面でconfirming中は両方のボタンがdisabledになる", () => {
    mockState.step = "confirm";
    mockState.preview = {
      high_school_name: "北海道札幌西高等学校",
      grade_display_name: "高1生",
      school_class_name: "A組",
    };
    mockState.confirming = true;
    render(<AccountLink />);

    expect(
      screen.getByRole("button", { name: "はい、紐付ける" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "戻る" })).toBeDisabled();
  });

  it("紐付け成功後(isLinked)は遷移待ちの間も確認画面のボタンがdisabledになる", () => {
    mockState.step = "confirm";
    mockState.preview = {
      high_school_name: "北海道札幌西高等学校",
      grade_display_name: "高1生",
      school_class_name: "A組",
    };
    mockState.isLinked = true;
    render(<AccountLink />);

    expect(
      screen.getByRole("button", { name: "はい、紐付ける" }),
    ).toBeDisabled();
  });
});
