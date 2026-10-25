import { describe, expect, it, vi } from "vitest";
import InterviewDetailPage from "./page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/features/teacher/InterviewDetail", () => ({
  InterviewDetail: () => null,
}));

const renderPage = (interviewId: string) =>
  InterviewDetailPage({ params: Promise.resolve({ interviewId }) });

describe("teacher/interviews/[interviewId]", () => {
  it("数値のIDなら、その面談の詳細を表示する", async () => {
    const element = await renderPage("12");

    expect(element.props).toEqual({ interviewId: 12 });
    expect(element.key).toBe("12");
  });

  it.each(["abc", "1.5", "-1", "1e3", ""])(
    "数値でないID(%s)は、APIに問い合わせず404にする",
    async (interviewId) => {
      await expect(renderPage(interviewId)).rejects.toThrow("NEXT_NOT_FOUND");
    },
  );
});
