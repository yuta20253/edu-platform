import { render, screen } from "@testing-library/react";
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

  it("データ取得中はローディングスピナーが表示される", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    render(<GradesTab schoolId={1} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
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

    expect(
      await screen.findByText("学年が登録されていません"),
    ).toBeInTheDocument();
  });
});
