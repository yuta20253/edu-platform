import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { Tasks } from "./index";

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
    status,
    onPageChange,
    onStatusChange,
  }: {
    page: number;
    status: string;
    onPageChange: (page: number) => void;
    onStatusChange: (status: string) => void;
  }) => (
    <div>
      <span>{`タスク一覧本体 ${page} ${status}`}</span>
      <button onClick={() => onPageChange(2)}>次へ</button>
      <button onClick={() => onStatusChange("completed")}>完了のみ</button>
    </div>
  ),
}));

const DEFAULT_STATUS = "active";

describe("student/Tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化のmockResolvedValueOnceが次のテストに漏れないようにする
    vi.mocked(apiClient.get).mockReset();
  });

  it("取得中はスピナーを表示し、エラーは表示しない", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<Tasks />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("取得に成功すると画面を表示する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });
    render(<Tasks />);

    expect(
      await screen.findByText(`タスク一覧本体 1 ${DEFAULT_STATUS}`),
    ).toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe(
      "/api/student/tasks",
    );
    expect(vi.mocked(apiClient.get).mock.calls[0][1]).toMatchObject({
      params: { page: "1" },
    });
  });

  it("取得に失敗するとエラーを表示し、再試行で再取得できる", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: {} });
    render(<Tasks />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(
      await screen.findByText(`タスク一覧本体 1 ${DEFAULT_STATUS}`),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("401のときは/loginに遷移し、エラーは表示しない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    render(<Tasks />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ページを切り替えても、前のページの画面を残したまま再取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });
    render(<Tasks />);
    await screen.findByText(`タスク一覧本体 1 ${DEFAULT_STATUS}`);

    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    expect(
      await screen.findByText(`タスク一覧本体 2 ${DEFAULT_STATUS}`),
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("絞り込みを切り替えると、1ページ目に戻して status 付きで再取得し、前の画面を残す", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });
    render(<Tasks />);
    await screen.findByText(`タスク一覧本体 1 ${DEFAULT_STATUS}`);
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    await screen.findByText(`タスク一覧本体 2 ${DEFAULT_STATUS}`);

    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: "完了のみ" }));

    expect(
      await screen.findByText("タスク一覧本体 1 completed"),
    ).toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.lastCall?.[1]).toMatchObject({
      params: { page: "1", status: "completed" },
    });
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("成功 → 失敗 → 再試行のあいだ、再試行が終わるまで前の画面を残す", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });
    render(<Tasks />);
    await screen.findByText(`タスク一覧本体 1 ${DEFAULT_STATUS}`);

    vi.mocked(apiClient.get).mockRejectedValueOnce({
      response: { status: 500 },
    });
    fireEvent.click(screen.getByRole("button", { name: "完了のみ" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(
      await screen.findByText("タスク一覧本体 1 completed"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  // render() は effect を流し切ってから返るため、初回描画だけを見るにはサーバー描画を使う
  it("初回描画では、エラー表示を出さずスピナーを出す", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const html = renderToString(<Tasks />);

    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("データの取得に失敗しました");
  });
});
