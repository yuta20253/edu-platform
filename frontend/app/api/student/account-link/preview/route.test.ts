import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/libs/server/backend/fetch";
import {
  BackendFetchError,
  BackendUnauthorizedError,
} from "@/libs/server/backend/error";
import { POST } from "./route";

vi.mock("@/libs/server/backend/fetch", () => ({
  backendFetch: vi.fn(),
}));

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/student/account-link/preview", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/student/account-link/preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("student_numberをバックエンドへ転送し、成功時のレスポンスをそのまま返す", async () => {
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: {
        high_school_name: "北海道札幌西高等学校",
        grade_display_name: "高1生",
        school_class_name: "A組",
      },
      setCookie: null,
    });

    const res = await post({ student_number: "AB12-CD3456" });

    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/student/account_link/preview",
      {
        method: "POST",
        body: { student_number: "AB12-CD3456" },
      },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      high_school_name: "北海道札幌西高等学校",
      grade_display_name: "高1生",
      school_class_name: "A組",
    });
  });

  it("バックエンド側のエラー(400/404など)をそのまま転送する", async () => {
    vi.mocked(backendFetch).mockRejectedValue(
      new BackendFetchError(
        404,
        "Backend request failed: 404",
        JSON.stringify({
          errors: [
            "見つからないか、すでに使用されています。心当たりがある場合は学校へお問い合わせください",
          ],
        }),
      ),
    );

    const res = await post({ student_number: "NOT-EXIST" });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      errors: [
        "見つからないか、すでに使用されています。心当たりがある場合は学校へお問い合わせください",
      ],
    });
  });

  it("未ログインのとき401を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new BackendUnauthorizedError());

    const res = await post({ student_number: "AB12-CD3456" });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});
