import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignUp } from "./index";
import { useSubmit } from "./hooks/hooks";

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

vi.mock("./hooks/hooks", () => ({
  useSubmit: vi.fn(),
}));

vi.mock("./hooks/useFetchPrefectures", () => ({
  useFetchPrefectures: () => ({ prefectures: [] }),
}));

vi.mock("./hooks/useFetchSchools", () => ({
  useFetchSchools: () => ({
    highSchools: [],
    setHighSchools: vi.fn(),
    fetchSchools: vi.fn(),
  }),
}));

vi.mock("./hooks/useFetchGrades", () => ({
  useFetchGrades: () => ({
    grades: [],
    setGrades: vi.fn(),
    fetchGrades: vi.fn(),
  }),
}));

const scrollIntoView = vi.fn();

const input = (name: string) =>
  document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;

const fillAndSubmit = async () => {
  await userEvent.type(input("user.email"), "test@example.com");
  await userEvent.type(input("user.password"), "password123");
  await userEvent.type(input("user.password_confirmation"), "password123");
  await userEvent.click(screen.getByRole("button", { name: "登録" }));
};

describe("SignUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  it("送信中は登録ボタンが非活性になり、二重送信できない", async () => {
    const onSubmit = vi.fn(() => new Promise<void>(() => {}));
    vi.mocked(useSubmit).mockReturnValue({ onSubmit });
    render(<SignUp userRole="student" />);

    await fillAndSubmit();

    const button = await screen.findByRole("button", { name: "登録中..." });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("送信に成功したら画面遷移が終わるまで登録ボタンは非活性のまま", async () => {
    const onSubmit = vi.fn(async () => {});
    vi.mocked(useSubmit).mockReturnValue({ onSubmit });
    render(<SignUp userRole="student" />);

    await fillAndSubmit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "登録中..." })).toBeDisabled();
  });

  it("送信でエラーが出たら登録ボタンが再び押せる", async () => {
    vi.mocked(useSubmit).mockImplementation(({ setErrorMessage }) => ({
      onSubmit: async () => {
        setErrorMessage("新規登録に失敗しました");
      },
    }));
    render(<SignUp userRole="student" />);

    await fillAndSubmit();

    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "登録" })).toBeEnabled();
  });

  it("送信でエラーが出たらエラー表示へスクロールする", async () => {
    vi.mocked(useSubmit).mockImplementation(({ setErrorMessage }) => ({
      onSubmit: async () => {
        setErrorMessage("メールアドレスはすでに使われています");
      },
    }));
    render(<SignUp userRole="student" />);

    await fillAndSubmit();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("メールアドレスはすでに使われています");
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(scrollIntoView.mock.contexts[0]).toBe(alert);
  });

  it("エラーが無いときはスクロールしない", () => {
    vi.mocked(useSubmit).mockReturnValue({ onSubmit: vi.fn() });
    render(<SignUp userRole="student" />);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("学校名検索の注釈テキストはエラーに見えない注釈色(text.secondary)で表示される", () => {
    vi.mocked(useSubmit).mockReturnValue({ onSubmit: vi.fn() });
    render(<SignUp userRole="student" />);

    const hint = screen.getByText(
      "都道府県を選択後、学校名を2文字以上入力すると候補が表示されます",
    );

    expect(getComputedStyle(hint).color).toBe("rgba(0, 0, 0, 0.6)");
  });
});
