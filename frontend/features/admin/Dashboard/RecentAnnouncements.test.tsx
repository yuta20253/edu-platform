import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RecentAnnouncements } from "./RecentAnnouncements";
import type { DashboardAnnouncement } from "./types";

const published: DashboardAnnouncement = {
  id: 1,
  title: "配信済みのお知らせ",
  status: "published",
  published_at: "2026-03-18T01:30:00.000Z",
  scheduled_at: null,
  created_at: "2026-03-17T00:00:00.000Z",
};

const scheduled: DashboardAnnouncement = {
  id: 2,
  title: "予約配信のお知らせ",
  status: "scheduled",
  published_at: null,
  scheduled_at: "2026-03-25T01:00:00.000Z",
  created_at: "2026-03-17T00:00:00.000Z",
};

const draft: DashboardAnnouncement = {
  id: 3,
  title: "下書きのお知らせ",
  status: "draft",
  published_at: null,
  scheduled_at: null,
  created_at: "2026-03-16T00:00:00.000Z",
};

describe("RecentAnnouncements", () => {
  it("お知らせのタイトルが表示される", () => {
    render(
      <RecentAnnouncements announcements={[published, scheduled, draft]} />,
    );
    expect(screen.getByText("配信済みのお知らせ")).toBeInTheDocument();
    expect(screen.getByText("予約配信のお知らせ")).toBeInTheDocument();
    expect(screen.getByText("下書きのお知らせ")).toBeInTheDocument();
  });

  it("ステータスバッジが表示される", () => {
    render(
      <RecentAnnouncements announcements={[published, scheduled, draft]} />,
    );
    expect(screen.getByText("配信済み")).toBeInTheDocument();
    expect(screen.getByText("予約配信")).toBeInTheDocument();
    expect(screen.getByText("下書き")).toBeInTheDocument();
  });

  it("配信済みはpublished_atの日時を表示する", () => {
    render(<RecentAnnouncements announcements={[published]} />);
    expect(screen.getByText("2026/03/18 10:30")).toBeInTheDocument();
  });

  it("予約配信はscheduled_atの日時に「配信予定」を添えて表示する", () => {
    render(<RecentAnnouncements announcements={[scheduled]} />);
    expect(screen.getByText("2026/03/25 10:00 配信予定")).toBeInTheDocument();
  });

  it("下書きはcreated_atの日付のみに「作成」を添えて表示する", () => {
    render(<RecentAnnouncements announcements={[draft]} />);
    expect(screen.getByText("2026/03/16 作成")).toBeInTheDocument();
  });

  it("各行が該当のお知らせ詳細へリンクする", () => {
    render(<RecentAnnouncements announcements={[published]} />);
    const link = screen.getByRole("link", { name: /配信済みのお知らせ/ });
    expect(link).toHaveAttribute("href", "/admin/notices/1");
  });

  it("「すべて見る」リンクがお知らせ一覧を指す", () => {
    render(<RecentAnnouncements announcements={[published]} />);
    const link = screen.getByRole("link", { name: "すべて見る" });
    expect(link).toHaveAttribute("href", "/admin/notices");
  });

  it("お知らせが空のとき空状態とCTAが表示される", () => {
    render(<RecentAnnouncements announcements={[]} />);
    expect(screen.getByText("お知らせがまだありません")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "お知らせを作成する" });
    expect(link).toHaveAttribute("href", "/admin/notices/new");
  });
});
