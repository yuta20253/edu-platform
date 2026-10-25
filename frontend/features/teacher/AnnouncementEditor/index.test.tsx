import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnnouncementEditor } from "./index";
import type { AnnouncementEditData } from "./types";

const useAnnouncementEditorMock = vi.fn();

vi.mock("./hooks/useAnnouncementEditor", () => ({
  useAnnouncementEditor: (announcementId?: number) =>
    useAnnouncementEditorMock(announcementId),
}));

vi.mock("./hooks/useAnnouncementTargetOptions", () => ({
  useAnnouncementTargetOptions: () => ({ data: null, error: null }),
}));

vi.mock("./Presenter", () => ({
  Presenter: ({ editData }: { editData: AnnouncementEditData | null }) => (
    <div data-testid="presenter">
      {editData?.announcement.title ?? "新規作成"}
    </div>
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const editData: AnnouncementEditData = {
  announcement: {
    id: 9,
    title: "既存のお知らせ",
    content: "既存の本文",
    status: "draft",
    scheduled_at: null,
  },
  announcement_targets: [],
};

const hookResult = (overrides: Record<string, unknown>) => ({
  isEditMode: true,
  editData: null,
  fetchError: null,
  refetch: vi.fn(),
  submitting: false,
  submitError: null,
  onSaveDraft: vi.fn(),
  onDeliver: vi.fn(),
  ...overrides,
});

describe("AnnouncementEditor", () => {
  beforeEach(() => {
    useAnnouncementEditorMock.mockReset();
  });

  it("新規作成時はPresenterを表示する", () => {
    useAnnouncementEditorMock.mockReturnValue(
      hookResult({ isEditMode: false }),
    );

    render(<AnnouncementEditor />);

    expect(useAnnouncementEditorMock).toHaveBeenCalledWith(undefined);
    expect(screen.getByTestId("presenter")).toHaveTextContent("新規作成");
  });

  it("編集時は取得が終わるまでPresenterを表示せずスピナーを表示する", () => {
    useAnnouncementEditorMock.mockReturnValue(hookResult({}));

    render(<AnnouncementEditor announcementId={9} />);

    expect(useAnnouncementEditorMock).toHaveBeenCalledWith(9);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();
  });

  it("編集時は取得した現在の値をPresenterに渡す", () => {
    useAnnouncementEditorMock.mockReturnValue(hookResult({ editData }));

    render(<AnnouncementEditor announcementId={9} />);

    expect(screen.getByTestId("presenter")).toHaveTextContent("既存のお知らせ");
  });

  it("取得に失敗したらエラーを表示し、再試行でrefetchが呼ばれる", () => {
    const refetch = vi.fn();
    useAnnouncementEditorMock.mockReturnValue(
      hookResult({ fetchError: "failed", refetch }),
    );

    render(<AnnouncementEditor announcementId={9} />);

    expect(
      screen.getByText("お知らせの取得に失敗しました"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();
  });

  it("他の教員のお知らせは編集できない旨と一覧へ戻るリンクを表示し、再試行は出さない", () => {
    useAnnouncementEditorMock.mockReturnValue(
      hookResult({ fetchError: "forbidden" }),
    );

    render(<AnnouncementEditor announcementId={9} />);

    expect(
      screen.getByText("このお知らせは編集できません"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "再試行" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "お知らせ一覧へ戻る" }),
    ).toHaveAttribute("href", "/teacher/announcements");
    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();
  });
});
