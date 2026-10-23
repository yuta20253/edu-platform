import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { Goals } from "./index";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), delete: vi.fn() },
}));

vi.mock("./Presenter", () => ({
  Presenter: ({
    page,
    onPageChange,
    onDeleteClick,
    onDeleteConfirm,
  }: {
    page: number;
    onPageChange: (page: number) => void;
    onDeleteClick: (id: number, title: string) => void;
    onDeleteConfirm: () => void;
  }) => (
    <div>
      <span>{`目標一覧本体 ${page}`}</span>
      <button onClick={() => onPageChange(2)}>次へ</button>
      <button onClick={() => onDeleteClick(1, "目標")}>削除</button>
      <button onClick={onDeleteConfirm}>削除する</button>
    </div>
  ),
}));

describe("student/Goals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化のmockResolvedValueOnceが次のテストに漏れないようにする
    vi.mocked(apiClient.get).mockReset();
  });

  it("取得中はスピナーを表示し、エラーは表示しない", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<Goals />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("取得に成功すると画面を表示する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { goals: [] } });
    render(<Goals />);

    expect(await screen.findByText("目標一覧本体 1")).toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe(
      "/api/student/goals",
    );
  });

  it("取得に失敗するとエラーを表示し、再試行で再取得できる", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: { goals: [] } });
    render(<Goals />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(await screen.findByText("目標一覧本体 1")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("401のときは/loginに遷移し、エラーは表示しない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    render(<Goals />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ページを切り替えても、前のページの画面を残したまま再取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { goals: [] } });
    render(<Goals />);
    await screen.findByText("目標一覧本体 1");

    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    expect(await screen.findByText("目標一覧本体 2")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("削除に成功すると再取得し、完了するまで前の画面を残す", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { goals: [] } });
    vi.mocked(apiClient.delete).mockResolvedValue({});
    render(<Goals />);
    await screen.findByText("目標一覧本体 1");

    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
    expect(screen.getByText("目標一覧本体 1")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  // render() は effect を流し切ってから返るため、初回描画だけを見るにはサーバー描画を使う
  it("初回描画では、エラー表示を出さずスピナーを出す", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const html = renderToString(<Goals />);

    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("データの取得に失敗しました");
  });
});
