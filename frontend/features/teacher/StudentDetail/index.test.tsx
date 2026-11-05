import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { StudentDetail } from "./index";

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
    error,
    onTabChange,
    onRetry,
  }: {
    error: boolean;
    onTabChange: (tab: "goals") => void;
    onRetry: () => void;
  }) => (
    <div>
      <span>生徒詳細本体</span>
      {error && <span>タブの取得に失敗</span>}
      <button onClick={onRetry}>Presenterの再試行</button>
      <button onClick={() => onTabChange("goals")}>目標</button>
    </div>
  ),
}));

describe("teacher/StudentDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化のmockResolvedValueOnceが次のテストに漏れないようにする
    vi.mocked(apiClient.get).mockReset();
  });

  it("取得中はスピナーを表示し、エラーは表示しない", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<StudentDetail studentId={1} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("取得に成功すると画面を表示する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 1 } });
    render(<StudentDetail studentId={1} />);

    expect(await screen.findByText("生徒詳細本体")).toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe(
      "/api/teacher/students/1",
    );
  });

  it("最初の取得に失敗するとエラーを表示し、再試行で再取得できる", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: { id: 1 } });
    render(<StudentDetail studentId={1} />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(await screen.findByText("生徒詳細本体")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("401のときは/loginに遷移し、エラーは表示しない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    render(<StudentDetail studentId={1} />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("タブ切り替え後に失敗しても、画面全体は置き換えずPresenterにエラーを渡す", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: { id: 1 } })
      .mockRejectedValueOnce({ response: { status: 500 } });
    render(<StudentDetail studentId={1} />);
    await screen.findByText("生徒詳細本体");

    fireEvent.click(screen.getByRole("button", { name: "目標" }));

    expect(await screen.findByText("タブの取得に失敗")).toBeInTheDocument();
    expect(screen.getByText("生徒詳細本体")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("タブ切り替え後の失敗は、Presenterの再試行で同じタブを再取得して画面を出す", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: { id: 1 } })
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: { id: 1 } });
    render(<StudentDetail studentId={1} />);
    await screen.findByText("生徒詳細本体");
    fireEvent.click(screen.getByRole("button", { name: "目標" }));
    await screen.findByText("タブの取得に失敗");

    fireEvent.click(screen.getByRole("button", { name: "Presenterの再試行" }));

    await waitFor(() =>
      expect(screen.queryByText("タブの取得に失敗")).not.toBeInTheDocument(),
    );
    const calls = vi.mocked(apiClient.get).mock.calls;
    expect(calls).toHaveLength(3);
    // 失敗したリクエストと同じタブで取り直す
    expect(calls[2][1]).toMatchObject({ params: { tab: "goals" } });
    expect(calls[1][1]).toMatchObject({ params: { tab: "goals" } });
  });
});
