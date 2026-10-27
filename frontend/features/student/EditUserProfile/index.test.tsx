import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMeFromBackend } from "@/libs/server/me";
import { getPrefectures } from "@/libs/server/prefectures";
import { EditUserProfile } from "./index";
import { Container } from "./Container";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [{ name: "token", value: "abc" }],
  }),
}));

vi.mock("@/libs/server/me", () => ({
  getMeFromBackend: vi.fn(),
}));

vi.mock("@/libs/server/prefectures", () => ({
  getPrefectures: vi.fn(),
}));

// redirect() は例外を投げて描画を打ち切るので、同じように投げるモックにする。
// ページ側で握りつぶさないことも、この例外が外まで届くことで確かめる。
const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

vi.mock("./Container", () => ({
  Container: () => null,
}));

const user = { id: 1, name: "生徒太郎" };
const prefectures = [{ id: 1, name: "北海道" }];

describe("student/EditUserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化の mockResolvedValueOnce が次のテストに漏れないようにする
    vi.mocked(getMeFromBackend).mockReset();
    vi.mocked(getPrefectures).mockReset();
  });

  it("ユーザーが取得できなかったときは、スピナーで止まらず /login にリダイレクトする", async () => {
    vi.mocked(getMeFromBackend).mockResolvedValue(null);
    vi.mocked(getPrefectures).mockResolvedValue([]);

    await expect(EditUserProfile()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("ユーザーが取得できなかったときは、都道府県を取得しにいかない(未ログインでの無駄な取得や、401 の例外を避ける)", async () => {
    vi.mocked(getMeFromBackend).mockResolvedValue(null);
    // セッション切れでは、都道府県の取得は 401 の例外になる
    vi.mocked(getPrefectures).mockRejectedValue(
      new Error("BackendUnauthorizedError"),
    );

    await expect(EditUserProfile()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(getPrefectures).not.toHaveBeenCalled();
  });

  it("ユーザーが取得できたときは、ユーザーと都道府県を渡して Container を描画する", async () => {
    vi.mocked(getMeFromBackend).mockResolvedValue(
      user as unknown as Awaited<ReturnType<typeof getMeFromBackend>>,
    );
    vi.mocked(getPrefectures).mockResolvedValue(
      prefectures as unknown as Awaited<ReturnType<typeof getPrefectures>>,
    );

    const element = await EditUserProfile();

    expect(getMeFromBackend).toHaveBeenCalledWith("token=abc");
    expect(redirectMock).not.toHaveBeenCalled();
    expect(isValidElement(element)).toBe(true);
    expect((element as React.ReactElement).type).toBe(Container);
    expect((element as React.ReactElement).props).toEqual({
      user,
      prefectures,
    });
  });
});
