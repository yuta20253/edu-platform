import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { NoticeCreate } from "./index";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

vi.mock("@/features/admin/NoticeEditor/Presenter", () => ({
  Presenter: ({ notice }: { notice: unknown }) => (
    <div data-testid="presenter" data-notice={String(notice)} />
  ),
}));

describe("NoticeCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("取得せず、空のフォーム(notice=null)を表示する", () => {
    render(<NoticeCreate />);

    expect(screen.getByTestId("presenter")).toHaveAttribute(
      "data-notice",
      "null",
    );
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
