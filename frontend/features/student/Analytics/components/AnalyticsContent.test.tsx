import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { AnalyticsContent } from "./AnalyticsContent";

const routerMock = { push: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const courseParams = { type: "course_rank" as const, course_id: "1" };

describe("AnalyticsContent(順位)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { rank: 3, total_users: 30 },
    });
  });

  it("コース内順位でコース未選択の場合は案内メッセージを表示し、取得しない", () => {
    render(<AnalyticsContent type="course_rank" params={null} />);
    expect(
      screen.getByText("教科とコースを選択してください"),
    ).toBeInTheDocument();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("単元内順位で単元未選択の場合は案内メッセージを表示する", () => {
    render(<AnalyticsContent type="unit_rank" params={null} />);
    expect(
      screen.getByText("コースと単元を選択してください"),
    ).toBeInTheDocument();
  });

  it("選択が揃ったら順位を取得して表示する", async () => {
    render(<AnalyticsContent type="course_rank" params={courseParams} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(await screen.findByText("30人中 3位")).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/analytics", {
      params: courseParams,
      signal: expect.any(AbortSignal),
    });
  });

  it("取得に失敗したときはこのセクションにエラーを出し、再試行できる", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("network error"));
    render(<AnalyticsContent type="course_rank" params={courseParams} />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "再試行" }));

    expect(await screen.findByText("30人中 3位")).toBeInTheDocument();
  });

  it("選択が変わったら前の順位を残さず、新しい順位を取得する", async () => {
    const { rerender } = render(
      <AnalyticsContent type="course_rank" params={courseParams} />,
    );
    await screen.findByText("30人中 3位");
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));

    rerender(
      <AnalyticsContent
        type="course_rank"
        params={{ type: "course_rank", course_id: "2" }}
      />,
    );

    expect(screen.queryByText("30人中 3位")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
