import { render, screen } from "@testing-library/react";
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
});
