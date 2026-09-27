import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Login } from "./index";
import { useSubmit } from "./hooks";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("./hooks", () => ({
  useSubmit: vi.fn(),
}));

const onSubmit = vi.fn();

const passwordInput = () =>
  document.querySelector<HTMLInputElement>('input[name="password"]')!;

const fillAndSubmit = async (email: string, password: string) => {
  await userEvent.type(screen.getByRole("textbox"), email);
  await userEvent.type(passwordInput(), password);
  await userEvent.click(screen.getByRole("button", { name: "ログイン" }));
};

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSubmit).mockReturnValue({ onSubmit });
  });

  it("見出しとフォームが表示される", () => {
    render(<Login />);
    expect(
      screen.getByRole("heading", { name: "おかえりなさい" }),
    ).toBeInTheDocument();
    expect(screen.getByText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByText("パスワード")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ログイン" }),
    ).toBeInTheDocument();
  });

  it("新規作成リンクが /signup を指している", () => {
    render(<Login />);
    expect(screen.getByRole("link", { name: "新規作成" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("パスワード再設定リンクが /password/reset を指している", () => {
    render(<Login />);
    expect(
      screen.getByRole("link", { name: "パスワードをお忘れの方はこちら" }),
    ).toHaveAttribute("href", "/password/reset");
  });

  it("未入力で送信すると必須エラーが表示され、送信されない", async () => {
    render(<Login />);
    await userEvent.click(screen.getByRole("button", { name: "ログイン" }));

    expect(
      await screen.findByText("メールアドレスを入力してください"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("パスワードを入力してください"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("メールアドレスの形式が不正だとエラーが表示される", async () => {
    render(<Login />);
    await fillAndSubmit("not-an-email", "password123");

    expect(
      await screen.findByText("メールアドレスの形式が正しくありません"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("パスワードが8文字未満だとエラーが表示される", async () => {
    render(<Login />);
    await fillAndSubmit("hina@example.com", "short");

    expect(
      await screen.findByText("8文字以上で入力してください"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("正しい入力で送信すると入力内容が onSubmit に渡される", async () => {
    render(<Login />);
    await fillAndSubmit("hina@example.com", "password123");

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({
      email: "hina@example.com",
      password: "password123",
    });
  });

  it("useSubmit がエラーメッセージを設定すると画面に表示される", async () => {
    vi.mocked(useSubmit).mockImplementation(({ setErrorMessage }) => ({
      onSubmit: async () => {
        setErrorMessage("ログインに失敗しました");
      },
    }));

    render(<Login />);
    await fillAndSubmit("hina@example.com", "password123");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ログインに失敗しました",
    );
  });

  it("目のアイコンでパスワードの表示・非表示が切り替わる", async () => {
    render(<Login />);
    expect(passwordInput()).toHaveAttribute("type", "password");

    await userEvent.click(
      screen.getByRole("button", { name: "toggle password visibility" }),
    );
    expect(passwordInput()).toHaveAttribute("type", "text");

    await userEvent.click(
      screen.getByRole("button", { name: "toggle password visibility" }),
    );
    expect(passwordInput()).toHaveAttribute("type", "password");
  });
});
