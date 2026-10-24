import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { CreateInterview } from "./index";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

vi.mock("@/components/ui/ToastProvider", () => ({
  useToast: () => ({ show: vi.fn() }),
}));

vi.mock("./Presenter", () => ({
  Presenter: () => <div>面談申請本体</div>,
}));

const SUCCESS = { data: { teachers: [] } };

describe("student/CreateInterview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化のmockResolvedValueOnceが次のテストに漏れないようにする
    vi.mocked(apiClient.get).mockReset();
  });

  it("取得中はスピナーを表示し、エラーは表示しない", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<CreateInterview />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("取得に成功すると画面を表示する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(SUCCESS);
    render(<CreateInterview />);

    expect(await screen.findByText("面談申請本体")).toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe(
      "/api/student/teachers",
    );
  });

  it("取得に失敗するとエラーを表示し、再試行で再取得できる", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce(SUCCESS);
    render(<CreateInterview />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    expect(
      screen.getByText("先生の一覧を取得できませんでした"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(await screen.findByText("面談申請本体")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("401のときは/loginに遷移し、エラーは表示しない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    render(<CreateInterview />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // render() は effect を流し切ってから返るため、初回描画だけを見るにはサーバー描画を使う
  // (`loading` の初期値が true のため、現行でもスピナーを出す。Red にならない回帰防止)
  it("初回描画では、エラー表示を出さずスピナーを出す", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const html = renderToString(<CreateInterview />);

    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("データの取得に失敗しました");
  });
});
