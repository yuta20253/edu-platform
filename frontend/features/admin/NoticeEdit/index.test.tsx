import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { NoticeEdit } from "./index";

const pushMock = vi.fn();
const replaceMock = vi.fn();
const routerMock = { push: pushMock, replace: replaceMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

vi.mock("@/features/admin/NoticeEditor/Presenter", () => ({
  Presenter: ({ notice }: { notice: { title: string } | null }) => (
    <div data-testid="presenter">{notice?.title}</div>
  ),
}));

const draftNotice = {
  id: 1,
  title: "既存のお知らせ",
  content: "既存の本文",
  status: "draft" as const,
  target_type: "all_users" as const,
  published_at: null,
  scheduled_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  publisher: { id: 1, name: "管理者太郎", name_kana: "カンリシャタロウ" },
};

describe("NoticeEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockReset();
  });

  it("取得中はスケルトンを表示し、編集フォームは表示しない", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const { container } = render(<NoticeEdit noticeId={1} />);

    expect(container.querySelector(".MuiSkeleton-root")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();
  });

  it("取得に成功すると、取得した内容でフォームを表示する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { announcement: draftNotice },
    });

    render(<NoticeEdit noticeId={1} />);

    expect(await screen.findByTestId("presenter")).toHaveTextContent(
      "既存のお知らせ",
    );
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/admin/notices/1",
      expect.anything(),
    );
  });

  it("404以外で失敗すると「お知らせの取得に失敗しました」と再試行ボタンを表示し、再試行で再取得する", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: { announcement: draftNotice } });

    render(<NoticeEdit noticeId={1} />);

    expect(
      await screen.findByText("お知らせの取得に失敗しました"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(await screen.findByTestId("presenter")).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it("404のときは「お知らせが見つかりませんでした」と再試行ボタンを表示する", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 404 } });

    render(<NoticeEdit noticeId={1} />);

    expect(
      await screen.findByText("お知らせが見つかりませんでした"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("お知らせの取得に失敗しました"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "再試行" })).toBeInTheDocument();
  });
});
