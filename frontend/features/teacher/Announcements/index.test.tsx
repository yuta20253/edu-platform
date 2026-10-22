import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { Announcements } from "./index";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

vi.mock("./Presenter", () => ({
  Presenter: ({
    tab,
    page,
    onTabChange,
    onPageChange,
  }: {
    tab: string;
    page: number;
    onTabChange: (tab: "received" | "authored") => void;
    onPageChange: (page: number) => void;
  }) => (
    <div>
      <span>{`お知らせ一覧本体 ${tab} ${page}`}</span>
      <button onClick={() => onTabChange("authored")}>作成分</button>
      <button onClick={() => onPageChange(2)}>次へ</button>
    </div>
  ),
}));

const received = { announcements: [], meta: {} };

describe("teacher/Announcements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化のmockResolvedValueOnceが次のテストに漏れないようにする
    vi.mocked(apiClient.get).mockReset();
  });

  it("取得中はスピナーを表示し、エラーは表示しない", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<Announcements />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("取得に成功すると画面を表示する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: received });
    render(<Announcements />);

    expect(
      await screen.findByText("お知らせ一覧本体 received 1"),
    ).toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe(
      "/api/teacher/announcements",
    );
  });

  it("取得に失敗するとエラーを表示し、再試行で再取得できる", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: received });
    render(<Announcements />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(
      await screen.findByText("お知らせ一覧本体 received 1"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("401のときは/loginに遷移し、エラーは表示しない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    render(<Announcements />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ページを切り替えても前のページの画面を残したまま再取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: received });
    render(<Announcements />);
    await screen.findByText("お知らせ一覧本体 received 1");

    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    expect(
      await screen.findByText("お知らせ一覧本体 received 2"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("タブを切り替えると、そのタブのデータを1ページ目から取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: received });
    render(<Announcements />);
    await screen.findByText("お知らせ一覧本体 received 1");
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    await screen.findByText("お知らせ一覧本体 received 2");

    fireEvent.click(screen.getByRole("button", { name: "作成分" }));

    expect(
      await screen.findByText("お知らせ一覧本体 authored 1"),
    ).toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.lastCall?.[1]).toMatchObject({
      params: { page: "1", tab: "authored" },
    });
  });
});
