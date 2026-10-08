import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Schools } from "./index";

const getMock = vi.fn();
const showMock = vi.fn();
const pushMock = vi.fn();

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: (...args: unknown[]) => getMock(...args) },
}));

// 実際の useRouter と同様、レンダリングごとに同じ参照を返す
const router = { push: pushMock };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("@/components/ui/ToastProvider", () => ({
  useToast: () => ({ show: showMock }),
}));

vi.mock("./Presenter", () => ({
  Presenter: () => <div data-testid="presenter" />,
}));

const schoolsData = {
  schools: [],
  meta: { current_page: 1, total_pages: 1, total_count: 0, per_page: 20 },
};

describe("Schools", () => {
  beforeEach(() => {
    getMock.mockReset();
    showMock.mockReset();
    pushMock.mockReset();
  });

  it("一覧と都道府県の取得に成功したら Presenter を表示する", async () => {
    getMock.mockImplementation((url: string) =>
      Promise.resolve({
        data: url === "/api/admin/schools" ? schoolsData : [],
      }),
    );

    render(<Schools />);

    expect(await screen.findByTestId("presenter")).toBeInTheDocument();
    expect(showMock).not.toHaveBeenCalled();
  });

  it("一覧の取得に失敗したらエラーを表示し、再試行で再取得する", async () => {
    getMock.mockImplementation((url: string) =>
      url === "/api/admin/schools"
        ? Promise.reject({ response: { status: 500 } })
        : Promise.resolve({ data: [] }),
    );

    render(<Schools />);

    fireEvent.click(await screen.findByRole("button", { name: "再試行" }));

    await waitFor(() => {
      const schoolCalls = getMock.mock.calls.filter(
        ([url]) => url === "/api/admin/schools",
      );
      expect(schoolCalls).toHaveLength(2);
    });
  });

  it("都道府県の取得に失敗したらトーストで通知する", async () => {
    getMock.mockImplementation((url: string) =>
      url === "/api/admin/schools"
        ? Promise.resolve({ data: schoolsData })
        : Promise.reject({ response: { status: 500 } }),
    );

    render(<Schools />);

    await waitFor(() =>
      expect(showMock).toHaveBeenCalledWith({
        message: "都道府県の取得に失敗しました",
        severity: "error",
      }),
    );
  });

  it("401 のときはログイン画面に遷移する", async () => {
    getMock.mockRejectedValue({ response: { status: 401 } });

    render(<Schools />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(showMock).not.toHaveBeenCalled();
  });
});
