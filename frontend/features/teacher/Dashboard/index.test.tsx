import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { Dashboard } from "./index";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

vi.mock("./Presenter", () => ({
  Presenter: () => <div>ダッシュボード本体</div>,
}));

describe("teacher/Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化のmockResolvedValueOnceが次のテストに漏れないようにする
    vi.mocked(apiClient.get).mockReset();
  });

  it("取得中はスピナーを表示し、エラーは表示しない", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<Dashboard />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("取得に成功するとダッシュボードを表示する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { students: [] } });
    render(<Dashboard />);

    expect(await screen.findByText("ダッシュボード本体")).toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe(
      "/api/teacher/dashboard",
    );
  });

  it("取得に失敗するとエラーを表示し、再試行で再取得できる", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: { students: [] } });
    render(<Dashboard />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(await screen.findByText("ダッシュボード本体")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("401のときは/loginに遷移し、エラーは表示しない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    render(<Dashboard />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
