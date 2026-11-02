import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMeFromBackend } from "@/libs/server/me";
import { UserProfile } from "./index";
import { Presenter } from "./Presenter";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [{ name: "token", value: "abc" }],
  }),
}));

vi.mock("@/libs/server/me", () => ({
  getMeFromBackend: vi.fn(),
}));

// redirect() は例外を投げて描画を打ち切るので、同じように投げるモックにする。
// ページ側で握りつぶさないことも、この例外が外まで届くことで確かめる。
const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

vi.mock("./Presenter", () => ({
  Presenter: () => null,
}));

const user = { id: 1, name: "生徒太郎" };

describe("student/UserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化の mockResolvedValueOnce が次のテストに漏れないようにする
    vi.mocked(getMeFromBackend).mockReset();
  });

  it("ユーザーが取得できなかったときは、スピナーで止まらず /login にリダイレクトする", async () => {
    vi.mocked(getMeFromBackend).mockResolvedValue(null);

    await expect(UserProfile()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("ユーザーが取得できたときは、Cookie を渡して取得し、Presenter を描画する", async () => {
    vi.mocked(getMeFromBackend).mockResolvedValue(
      user as unknown as Awaited<ReturnType<typeof getMeFromBackend>>,
    );

    const element = await UserProfile();

    expect(getMeFromBackend).toHaveBeenCalledWith("token=abc");
    expect(redirectMock).not.toHaveBeenCalled();
    expect(isValidElement(element)).toBe(true);
    expect((element as React.ReactElement).type).toBe(Presenter);
    expect((element as React.ReactElement).props).toEqual({ user });
  });
});
