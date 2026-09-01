import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { Announcement } from "@/types/announcement/announcement";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockAnnouncement: Announcement = {
  id: 1,
  title: "夏期講習のお知らせ",
  content: "夏期講習を開催します。\n奮ってご参加ください。",
  publisher: { id: 1, name: "運営事務局", name_kana: "ウンエイジムキョク" },
  published_at: "2025-06-01T10:00:00.000Z",
};

describe("AnnouncementDetailPresenter", () => {
  it("タイトル・発行者・内容が表示される", () => {
    render(<Presenter announcement={mockAnnouncement} />);
    expect(screen.getByText("夏期講習のお知らせ")).toBeInTheDocument();
    expect(screen.getByText("発行者：運営事務局")).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName.toLowerCase() === "p" &&
          element.textContent === mockAnnouncement.content,
      ),
    ).toBeInTheDocument();
  });

  it("content が空のとき「内容はまだ入力されていません。」と表示される", () => {
    render(<Presenter announcement={{ ...mockAnnouncement, content: "" }} />);
    expect(
      screen.getByText("内容はまだ入力されていません。"),
    ).toBeInTheDocument();
  });

  it("「お知らせ一覧に戻る」リンクが /announcements を指している", () => {
    render(<Presenter announcement={mockAnnouncement} />);
    expect(
      screen.getByRole("link", { name: /お知らせ一覧に戻る/ }),
    ).toHaveAttribute("href", "/announcements");
  });
});
