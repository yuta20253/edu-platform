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
    render(<ProfileMenu />);
    expect(screen.getByRole("link", { name: "お知らせ" })).toHaveAttribute(
      "href",
      "/announcements",
    );
  });

  it("ログアウトをクリックするとログアウトAPIを呼びログイン画面へ遷移する", async () => {
    render(<ProfileMenu />);
    await userEvent.click(screen.getByRole("button", { name: "ログアウト" }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith("/api/auth/logout");
      expect(push).toHaveBeenCalledWith("/login");
      expect(refresh).toHaveBeenCalled();
    });
  });
});
