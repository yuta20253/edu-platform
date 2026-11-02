import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

import AuthenticatedLayout from "./layout";

// me.ts は実物を通し、fetch だけをモックする(me.ts → レイアウトの結合)
describe("AuthenticatedLayout と getMeFromBackend の結合", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    redirectMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("/me が 500 のとき /login に redirect せず reject する", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));

    await expect(AuthenticatedLayout({ children: null })).rejects.not.toThrow(
      "NEXT_REDIRECT",
    );
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("/me が 401 のとき /login に redirect する", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));

    await expect(AuthenticatedLayout({ children: null })).rejects.toThrow(
      "NEXT_REDIRECT:/login",
    );
  });
});
