import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDetail } from "./index";

const showMock = vi.fn();
const useFetchAdminDetailMock = vi.fn();
const useUpdateAdminMock = vi.fn();
const usePasswordResetMock = vi.fn();

vi.mock("@/components/ui/ToastProvider", () => ({
  useToast: () => ({ show: showMock }),
}));

vi.mock("./hooks/useFetchAdminDetail", () => ({
  useFetchAdminDetail: () => useFetchAdminDetailMock(),
}));

vi.mock("./hooks/useUpdateAdmin", () => ({
  useUpdateAdmin: (params: unknown) => useUpdateAdminMock(params),
}));

vi.mock("./hooks/useDeleteAdmin", () => ({
  useDeleteAdmin: () => ({
    deleteDialogOpen: false,
    deleting: false,
    deleteErrors: [],
    handleDeleteClick: vi.fn(),
    handleDeleteDialogClose: vi.fn(),
    handleDeleteConfirm: vi.fn(),
  }),
}));

vi.mock("./hooks/usePasswordReset", () => ({
  usePasswordReset: (params: unknown) => usePasswordResetMock(params),
}));

vi.mock("./Presenter", () => ({
  Presenter: () => <div data-testid="presenter" />,
}));

const renderComponent = () =>
  render(<AdminDetail adminId={1} currentAdminId={2} prefectures={[]} />);

describe("AdminDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUpdateAdminMock.mockReturnValue({
      updating: false,
      updateErrors: [],
      handleUpdate: vi.fn(),
    });
    usePasswordResetMock.mockReturnValue({
      resettingPassword: false,
      handlePasswordReset: vi.fn(),
    });
  });

  it("取得中はスケルトンを表示し、スピナーは表示しない", () => {
    useFetchAdminDetailMock.mockReturnValue({
      admin: null,
      setAdmin: vi.fn(),
      fetchError: null,
      refetch: vi.fn(),
    });

    const { container } = renderComponent();

    expect(container.querySelector(".MuiSkeleton-root")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("取得に失敗したらエラーを表示し、再試行で refetch が呼ばれる", () => {
    const refetch = vi.fn();
    useFetchAdminDetailMock.mockReturnValue({
      admin: null,
      setAdmin: vi.fn(),
      fetchError: "管理者の取得に失敗しました",
      refetch,
    });

    renderComponent();

    expect(screen.getByText("管理者の取得に失敗しました")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("更新成功時にトーストを表示する", () => {
    const setAdmin = vi.fn();
    useFetchAdminDetailMock.mockReturnValue({
      admin: { id: 1, email: "a@example.com" },
      setAdmin,
      fetchError: null,
      refetch: vi.fn(),
    });

    renderComponent();
    const { onUpdated } = useUpdateAdminMock.mock.calls[0][0];
    onUpdated({ id: 1, email: "b@example.com" });

    expect(setAdmin).toHaveBeenCalledWith({ id: 1, email: "b@example.com" });
    expect(showMock).toHaveBeenCalledWith({ message: "管理者を更新しました" });
  });

  it("パスワード再設定メールの送信結果をトーストで通知する", () => {
    useFetchAdminDetailMock.mockReturnValue({
      admin: { id: 1, email: "a@example.com" },
      setAdmin: vi.fn(),
      fetchError: null,
      refetch: vi.fn(),
    });

    renderComponent();
    const { onSuccess, onError } = usePasswordResetMock.mock.calls[0][0];

    onSuccess();
    expect(showMock).toHaveBeenLastCalledWith({
      message: "パスワード再設定メールを送信しました",
    });

    onError();
    expect(showMock).toHaveBeenLastCalledWith({
      message: "パスワード再設定メールの送信に失敗しました",
      severity: "error",
    });
  });
});
