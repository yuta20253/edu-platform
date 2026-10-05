import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { POST } from "./route";

vi.mock("@/libs/server/rails/railsFetch", () => ({
  railsFetch: vi.fn(),
}));

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/student/account-link", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/student/account-link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("student_numberをRailsへ転送し、成功時のレスポンスをそのまま返す", async () => {
    vi.mocked(railsFetch).mockResolvedValue({
      status: 200,
      data: { message: "アカウントの紐付けが成功しました" },
      setCookie: null,
    });

    const res = await post({ student_number: "AB12-CD3456" });

    expect(railsFetch).toHaveBeenCalledWith("/api/v1/student/account_link", {
      method: "POST",
      body: { student_number: "AB12-CD3456" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      message: "アカウントの紐付けが成功しました",
    });
  });
});
