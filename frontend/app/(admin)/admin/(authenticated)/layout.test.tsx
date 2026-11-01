import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [{ name: "session", value: "abc" }],
  }),
}));

vi.mock("@/libs/server/me", () => ({ getMeFromBackend: vi.fn() }));

vi.mock("@/components/admin/AdminSidebar", () => ({
  AdminSidebar: () => null,
}));

import { getMeFromBackend } from "@/libs/server/me";
import AdminAuthenticatedLayout from "./layout";

describe("AdminAuthenticatedLayout", () => {
  beforeEach(() => {
    vi.mocked(getMeFromBackend).mockReset();
    redirectMock.mockClear();
  });

  it("getMeFromBackend が reject したとき、/login に redirect せず例外が伝わる", async () => {
    vi.mocked(getMeFromBackend).mockRejectedValue(new Error("backend down"));

    await expect(AdminAuthenticatedLayout({ children: null })).rejects.toThrow(
      "backend down",
    );
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("未ログイン(null)のとき /login に redirect する", async () => {
    vi.mocked(getMeFromBackend).mockResolvedValue(null);

    await expect(AdminAuthenticatedLayout({ children: null })).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
  });

  it("Cookie をヘッダー形式にして getMeFromBackend に渡す", async () => {
    vi.mocked(getMeFromBackend).mockResolvedValue(null);

    await AdminAuthenticatedLayout({ children: null }).catch(() => undefined);

    expect(getMeFromBackend).toHaveBeenCalledWith("session=abc");
  });

  it("ロールが admin でないときも /login に redirect する", async () => {
    vi.mocked(getMeFromBackend).mockResolvedValue({
      id: 1,
      user_role: { name: "student" },
    } as never);

    await expect(AdminAuthenticatedLayout({ children: null })).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
  });
});
