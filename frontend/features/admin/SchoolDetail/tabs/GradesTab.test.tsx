import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { GradesTab } from "./GradesTab";

const routerMock = { push: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("GradesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("データ取得中はスケルトンが表示される（スピナーは使わない）", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const { container } = render(<GradesTab schoolId={1} />);

    expect(container.querySelector(".MuiSkeleton-root")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("学年一覧が表示される", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        grades: [
          { id: 1, year: 1, display_name: "高１生" },
          { id: 2, year: 2, display_name: "高２生" },
        ],
      },
    });

    render(<GradesTab schoolId={1} />);

    expect(await screen.findByText("高１生")).toBeInTheDocument();
    expect(screen.getByText("高２生")).toBeInTheDocument();
  });

  it("学年が0件のとき空状態メッセージが表示される", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { grades: [] } });

    render(<GradesTab schoolId={1} />);

    expect(await screen.findByText("学年がまだありません")).toBeInTheDocument();
  });

  it("取得に失敗したらエラーを表示し、再試行で再取得する", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValue({ data: { grades: [] } });

    render(<GradesTab schoolId={1} />);

    fireEvent.click(await screen.findByRole("button", { name: "再試行" }));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
    expect(
      screen.queryByText("データの取得に失敗しました"),
    ).not.toBeInTheDocument();
  });
});
