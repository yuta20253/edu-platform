import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MeUser } from "@/types/common/me";
import { TeacherSidebar } from "./TeacherSidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/teacher/interviews",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: vi.fn() },
}));

const user = { name: "佐藤先生" } as MeUser;

describe("TeacherSidebar", () => {
  it("面談一覧へのリンクを表示し、面談一覧を開いているときは選択中にする", () => {
    render(<TeacherSidebar user={user} />);

    const link = screen.getByRole("link", { name: "面談" });
    expect(link).toHaveAttribute("href", "/teacher/interviews");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("学級申請へのリンクを学級の次に表示する", () => {
    render(<TeacherSidebar user={user} />);

    const labels = screen.getAllByRole("link").map((l) => l.textContent);
    expect(labels.indexOf("学級申請")).toBe(labels.indexOf("学級") + 1);
    expect(screen.getByRole("link", { name: "学級申請" })).toHaveAttribute(
      "href",
      "/teacher/school-class-requests",
    );
  });
});
