import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { AnnouncementsTab } from "./AnnouncementsTab";

const routerMock = { push: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("AnnouncementsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("お知らせ一覧が表示される", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        announcements: [
          {
            id: 1,
            title: "テストお知らせ",
            status: "published",
            published_at: "2026-01-01T00:00:00.000Z",
            scheduled_at: null,
            created_at: "2026-01-01T00:00:00.000Z",
          },
        ],
        meta: { current_page: 1, total_pages: 1, total_count: 1, per_page: 20 },
      },
    });

    render(<AnnouncementsTab schoolId={1} />);

    expect(await screen.findByText("テストお知らせ")).toBeInTheDocument();
    expect(screen.getByText("配信済み")).toBeInTheDocument();
  });

  it("お知らせが0件のとき空状態メッセージが表示される", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        announcements: [],
        meta: { current_page: 1, total_pages: 1, total_count: 0, per_page: 20 },
      },
    });

    render(<AnnouncementsTab schoolId={1} />);

    expect(await screen.findByText("お知らせがありません")).toBeInTheDocument();
  });

  it("ページネーションで次のページを取得できる", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        announcements: [
          {
            id: 1,
            title: "テストお知らせ",
            status: "published",
            published_at: "2026-01-01T00:00:00.000Z",
            scheduled_at: null,
            created_at: "2026-01-01T00:00:00.000Z",
          },
        ],
        meta: {
          current_page: 1,
          total_pages: 2,
          total_count: 21,
          per_page: 20,
        },
      },
    });

    render(<AnnouncementsTab schoolId={1} />);
    await screen.findByRole("navigation");

    fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));

    expect(apiClient.get).toHaveBeenLastCalledWith(
      "/api/admin/schools/1/announcements",
      { params: { page: "2" } },
    );
  });
});
