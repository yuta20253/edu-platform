import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AccountLink } from "./index";

const onSubmitMock = vi.fn();
vi.mock("./hooks/useSubmit", () => ({
  useSubmit: () => ({
    onSubmit: onSubmitMock,
    errorMessage: "",
    toast: { open: false, message: "", severity: "success" },
    closeToast: vi.fn(),
  }),
}));

describe("AccountLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("入力して送信するとonSubmitが正しい値で呼ばれる", async () => {
    render(<AccountLink />);

    fireEvent.change(
      screen.getByPlaceholderText("生徒コードを入力してください"),
      {
        target: { value: "AB12-CD3456" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "紐付ける" }));

    await waitFor(() =>
      expect(onSubmitMock).toHaveBeenCalledWith(
        { student_number: "AB12-CD3456" },
        expect.anything(),
      ),
    );
  });
});
