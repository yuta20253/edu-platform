import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { Footer } from "./index";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
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

const mockPathname = (path: string) => {
  vi.mocked(usePathname).mockReturnValue(path);
};

const activeLabels = () =>
  screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("aria-current") === "page")
    .map((link) => link.textContent);

describe("Footer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("5つのタブが正しいリンク先で表示される", () => {
    mockPathname("/");
    render(<Footer />);

    const expected = [
      ["ホーム", "/"],
      ["タスク", "/tasks"],
      ["進捗", "/analytics"],
      ["カレンダー", "#"],
      ["プロフィール", "/profile"],
    ];
    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(expected.length);
    expected.forEach(([label, href], i) => {
      expect(links[i]).toHaveTextContent(label);
      expect(links[i]).toHaveAttribute("href", href);
    });
  });

  it("トップページではホームだけがアクティブになる", () => {
    mockPathname("/");
    render(<Footer />);
    expect(activeLabels()).toEqual(["ホーム"]);
  });

  it.each([
    ["/tasks", "タスク"],
    ["/tasks/1", "タスク"],
    ["/analytics", "進捗"],
    ["/profile", "プロフィール"],
    ["/profile/edit", "プロフィール"],
  ])("%s ではアクティブなタブが「%s」になる", (path, label) => {
    mockPathname(path);
    render(<Footer />);
    expect(activeLabels()).toEqual([label]);
  });

  it("どのタブにも対応しないパスではアクティブなタブが無い", () => {
    mockPathname("/goals");
    render(<Footer />);
    expect(activeLabels()).toEqual([]);
  });

  it("カレンダー（仮リンク）はアクティブにならない", () => {
    mockPathname("#");
    render(<Footer />);
    expect(activeLabels()).toEqual([]);
  });

  it.each(["/login", "/signup", "/teacher/signup", "/password/reset"])(
    "%s では表示されない",
    (path) => {
      mockPathname(path);
      const { container } = render(<Footer />);
      expect(container.querySelector("footer")).toBeNull();
    },
  );

  it("パスワード再設定のトークン付きURLでも表示されない", () => {
    mockPathname("/password/reset/abc123");
    const { container } = render(<Footer />);
    expect(container.querySelector("footer")).toBeNull();
  });
});
