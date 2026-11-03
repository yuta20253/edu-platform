import { describe, expect, it, vi } from "vitest";
import SchoolClassRequestDetailPage from "./page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/features/teacher/SchoolClassRequestDetail", () => ({
  SchoolClassRequestDetail: () => null,
}));

const renderPage = (schoolClassRequestId: string) =>
  SchoolClassRequestDetailPage({
    params: Promise.resolve({ schoolClassRequestId }),
  });

describe("teacher/school-class-requests/[schoolClassRequestId]", () => {
  it("数値のIDなら、その学級申請の詳細を表示する", async () => {
    const element = await renderPage("12");

    expect(element.props).toEqual({ schoolClassRequestId: 12 });
    expect(element.key).toBe("12");
  });

  it.each(["abc", "1.5", "-1", "1e3", ""])(
    "数値でないID(%s)は、APIに問い合わせず404にする",
    async (schoolClassRequestId) => {
      await expect(renderPage(schoolClassRequestId)).rejects.toThrow(
        "NEXT_NOT_FOUND",
      );
    },
  );
});
