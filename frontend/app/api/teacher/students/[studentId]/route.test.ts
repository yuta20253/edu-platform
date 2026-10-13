import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { GET } from "./route";

vi.mock("@/libs/server/rails/railsFetch", () => ({
  railsFetch: vi.fn(),
}));

const get = (query: string) =>
  GET(new NextRequest(`http://localhost/api/teacher/students/1${query}`), {
    params: Promise.resolve({ studentId: "1" }),
  });

describe("GET /api/teacher/students/:studentId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(railsFetch).mockResolvedValue({
      status: 200,
      data: { id: 1, name: "山田太郎" },
      setCookie: null,
    });
  });

  it("tab 未指定のときはクエリを付けずにバックエンドへ転送する", async () => {
    await get("");
    expect(railsFetch).toHaveBeenCalledWith("/api/v1/teacher/students/1");
  });

  it("tab を指定したときはバックエンドへ転送する", async () => {
    await get("?tab=goals");
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/students/1?tab=goals",
    );
  });

  it("tasks タブの page をバックエンドへ転送する", async () => {
    await get("?tab=tasks&page=2");
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/students/1?tab=tasks&page=2",
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await get("");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1, name: "山田太郎" });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(new RailsUnauthorizedError());
    const res = await get("");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});
