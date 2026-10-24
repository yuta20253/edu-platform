import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
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
    page,
    onPageChange,
  }: {
    page: number;
    onPageChange: (page: number) => void;
  }) => (
    <div>
      <span>{`お知らせ一覧本体 ${page}`}</span>
      <button onClick={() => onPageChange(2)}>次へ</button>
    </div>
  ),
}));

describe("student/Announcements", () => {
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
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });
    render(<Announcements />);

    expect(await screen.findByText("お知らせ一覧本体 1")).toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe(
      "/api/student/announcements",
    );
    expect(vi.mocked(apiClient.get).mock.calls[0][1]).toMatchObject({
      params: { page: "1" },
    });
  });

  it("取得に失敗するとエラーを表示し、再試行で再取得できる", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: {} });
    render(<Announcements />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(await screen.findByText("お知らせ一覧本体 1")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("401のときは/loginに遷移し、エラーは表示しない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    render(<Announcements />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ページを切り替えても、前のページの画面を残したまま再取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });
    render(<Announcements />);
    await screen.findByText("お知らせ一覧本体 1");

    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    expect(await screen.findByText("お知らせ一覧本体 2")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  // render() は effect を流し切ってから返るため、初回描画だけを見るにはサーバー描画を使う
  // (現行でも `!data` でスピナーを出すので、Red にならない回帰防止)
  it("初回描画では、エラー表示を出さずスピナーを出す", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const html = renderToString(<Announcements />);

    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("データの取得に失敗しました");
  });
});
