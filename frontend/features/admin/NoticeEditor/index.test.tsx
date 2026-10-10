import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoticeEditor } from "./index";

const useNoticeEditorMock = vi.fn();

vi.mock("./hooks/useNoticeEditor", () => ({
  useNoticeEditor: () => useNoticeEditorMock(),
}));

vi.mock("./Presenter", () => ({
  Presenter: () => <div data-testid="presenter" />,
}));

describe("NoticeEditor", () => {
  beforeEach(() => {
    useNoticeEditorMock.mockReset();
  });

  it("取得に失敗したらエラーを表示し、再試行で refetch が呼ばれる", () => {
    const refetch = vi.fn();
    useNoticeEditorMock.mockReturnValue({
      isEditMode: true,
      notice: null,
      loading: false,
      fetchError: "お知らせの取得に失敗しました",
      refetch,
    });

    render(<NoticeEditor noticeId={1} />);

    expect(
      screen.getByText("お知らせの取得に失敗しました"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("編集時の取得中はスケルトンを表示し、スピナーは表示しない", () => {
    useNoticeEditorMock.mockReturnValue({
      isEditMode: true,
      notice: null,
      loading: true,
      fetchError: null,
    });

    const { container } = render(<NoticeEditor noticeId={1} />);

    expect(container.querySelector(".MuiSkeleton-root")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();
  });

  it("新規作成時は Presenter を表示する", () => {
    useNoticeEditorMock.mockReturnValue({
      isEditMode: false,
      notice: null,
      loading: false,
      fetchError: null,
    });

    render(<NoticeEditor />);

    expect(screen.getByTestId("presenter")).toBeInTheDocument();
  });
});
