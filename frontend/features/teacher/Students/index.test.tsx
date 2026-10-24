import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { Students } from "./index";

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
      <span>生徒一覧 page:{page}</span>
      <button onClick={() => onPageChange(2)}>次へ</button>
    </div>
  ),
}));

const studentsData = {
  students: [],
  meta: { current_page: 1, total_pages: 2, total_count: 0, per_page: 20 },
};

describe("teacher/Students", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化のmockResolvedValueOnceが次のテストに漏れないようにする
    vi.mocked(apiClient.get).mockReset();
  });

  it("取得中はスピナーを表示し、エラーは表示しない", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<Students />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("取得に成功すると1ページ目の一覧を表示する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: studentsData });
    render(<Students />);

    expect(await screen.findByText("生徒一覧 page:1")).toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe(
      "/api/teacher/students",
    );
    expect(vi.mocked(apiClient.get).mock.calls[0][1]?.params).toEqual({
      page: "1",
    });
  });

  it("取得に失敗するとエラーを表示し、再試行で再取得できる", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: studentsData });
    render(<Students />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(await screen.findByText("生徒一覧 page:1")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ページ切替の再取得中は前回の一覧を表示し続ける", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: studentsData })
      .mockReturnValueOnce(new Promise(() => {}));
    render(<Students />);
    await screen.findByText("生徒一覧 page:1");

    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
    expect(vi.mocked(apiClient.get).mock.calls[1][1]?.params).toEqual({
      page: "2",
    });
    expect(screen.getByText(/生徒一覧/)).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("401のときは/loginに遷移し、エラーは表示しない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    render(<Students />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
