import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileMenu } from "./ProfileMenu";

const push = vi.fn();
const refresh = vi.fn();
const post = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

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

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: (...args: unknown[]) => post(...args) },
}));

describe("ProfileMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    post.mockResolvedValue({});
  });

  it("お知らせが /announcements へのリンクになっている", () => {
    render(<ProfileMenu accountLinked={true} />);
    expect(screen.getByRole("link", { name: "お知らせ" })).toHaveAttribute(
      "href",
      "/announcements",
    );
  });

  it("未紐付けの場合はお知らせの上にアカウント紐付けリンクを表示する", () => {
    render(<ProfileMenu accountLinked={false} />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveTextContent("アカウント紐付け");
    expect(links[0]).toHaveAttribute("href", "/account-link");
    expect(links[1]).toHaveTextContent("お知らせ");
  });

  it.each([
    ["紐付け済み", true],
    ["生徒以外", null],
  ])("%sの場合はアカウント紐付けリンクを表示しない", (_, accountLinked) => {
    render(<ProfileMenu accountLinked={accountLinked} />);
    expect(
      screen.queryByRole("link", { name: "アカウント紐付け" }),
    ).not.toBeInTheDocument();
  });

  it("ログアウトをクリックするとログアウトAPIを呼びログイン画面へ遷移する", async () => {
    render(<ProfileMenu accountLinked={true} />);
    await userEvent.click(screen.getByRole("button", { name: "ログアウト" }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith("/api/auth/logout");
      expect(push).toHaveBeenCalledWith("/login");
      expect(refresh).toHaveBeenCalled();
    });
  });
});
