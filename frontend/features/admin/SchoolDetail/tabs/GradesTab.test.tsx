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

  it("学年一覧が表示される", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        grades: [
          { id: 1, name: "高１生" },
          { id: 2, name: "高２生" },
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
