import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ToastProvider, useToast } from "./ToastProvider";

const ToastTrigger = ({
  message,
  severity,
}: {
  message: string;
  severity?: "success" | "error" | "info" | "warning";
}) => {
  const { show } = useToast();
  return (
    <button type="button" onClick={() => show({ message, severity })}>
      show
    </button>
  );
};

describe("ToastProvider / useToast", () => {
  it("初期状態ではトーストが表示されない", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="保存しました" />
      </ToastProvider>,
    );
    expect(screen.queryByText("保存しました")).not.toBeInTheDocument();
  });

  it("showを呼ぶとメッセージが表示される", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="保存しました" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "show" }));
    expect(screen.getByText("保存しました")).toBeInTheDocument();
  });

  it("severityを指定しない場合はsuccess扱いになる", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="保存しました" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "show" }));
    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-standardSuccess");
  });

  it("severity: errorを指定するとエラー表示になる", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="失敗しました" severity="error" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "show" }));
    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-standardError");
  });

  it("閉じるボタンでトーストが消える", async () => {
    render(
      <ToastProvider>
        <ToastTrigger message="保存しました" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "show" }));
    expect(screen.getByText("保存しました")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByText("保存しました")).not.toBeInTheDocument(),
    );
  });

  it("Provider外でuseToastを呼ぶとエラーになる", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<ToastTrigger message="保存しました" />)).toThrow(
      "useToast must be used within a ToastProvider",
    );

    consoleError.mockRestore();
  });
});
