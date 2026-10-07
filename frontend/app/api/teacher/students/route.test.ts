import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import {
  RailsFetchError,
  RailsUnauthorizedError,
} from "@/libs/server/rails/railsError";
import { GET, POST } from "./route";

vi.mock("@/libs/server/rails/railsFetch", () => ({
  railsFetch: vi.fn(),
}));

const get = (query: string) =>
  GET(new NextRequest(`http://localhost/api/teacher/students${query}`));

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/teacher/students", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

describe("GET /api/teacher/students", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(railsFetch).mockResolvedValue({
      status: 200,
      data: { students: [] },
      setCookie: null,
    });
  });

  it("page のみのときはそのままバックエンドへ転送する", async () => {
    await get("?page=2");
    expect(railsFetch).toHaveBeenCalledWith("/api/v1/teacher/students?page=2");
  });

  it("page 未指定のときは 1 ページ目として転送する", async () => {
    await get("");
    expect(railsFetch).toHaveBeenCalledWith("/api/v1/teacher/students?page=1");
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await get("?page=1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ students: [] });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(new RailsUnauthorizedError());
    const res = await get("?page=1");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});

describe("POST /api/teacher/students", () => {
  const input = {
    name: "山田太郎",
    name_kana: "ヤマダタロウ",
    email: "yamada@example.com",
    grade_id: 1,
    school_class_id: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("リクエストボディをそのままバックエンドへ転送する", async () => {
    vi.mocked(railsFetch).mockResolvedValue({
      status: 201,
      data: { message: "生徒の新規作成に成功しました。" },
      setCookie: null,
    });

    await post({ user: input });

    expect(railsFetch).toHaveBeenCalledWith("/api/v1/teacher/students", {
      method: "POST",
      body: { user: input },
    });
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    vi.mocked(railsFetch).mockResolvedValue({
      status: 201,
      data: { message: "生徒の新規作成に成功しました。" },
      setCookie: null,
    });

    const res = await post({ user: input });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      message: "生徒の新規作成に成功しました。",
    });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(new RailsUnauthorizedError());

    const res = await post({ user: input });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });

  it("422 のときはバックエンドのエラー内容をそのまま返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(
      new RailsFetchError(
        422,
        "Rails request failed: 422",
        JSON.stringify({ errors: ["Emailは既に生徒として登録されています"] }),
      ),
    );

    const res = await post({ user: input });

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      errors: ["Emailは既に生徒として登録されています"],
    });
  });

  it("不正なJSONボディのときは500を返す", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/teacher/students", {
        method: "POST",
        body: "{invalid-json",
      }),
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "INTERNAL_SERVER_ERROR" });
  });
});
