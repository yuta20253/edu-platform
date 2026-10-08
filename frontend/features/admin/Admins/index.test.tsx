import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Admins } from "./index";

const useFetchAdminsMock = vi.fn();

vi.mock("./hooks/useFetchAdmins", () => ({
  useFetchAdmins: () => useFetchAdminsMock(),
}));

vi.mock("./hooks/useCreateAdmin", () => ({
  useCreateAdmin: () => ({
    drawerOpen: false,
    creating: false,
    createErrors: [],
    handleAddClick: vi.fn(),
    handleDrawerClose: vi.fn(),
    handleCreate: vi.fn(),
  }),
}));

vi.mock("./Presenter", () => ({
  Presenter: () => <div data-testid="presenter" />,
}));

describe("Admins", () => {
  beforeEach(() => {
    useFetchAdminsMock.mockReset();
  });

  it("取得に失敗したらエラーを表示し、再試行で refetch が呼ばれる", () => {
    const refetch = vi.fn();
    useFetchAdminsMock.mockReturnValue({ data: null, error: true, refetch });

    render(<Admins />);

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("データがあれば Presenter を表示する", () => {
    useFetchAdminsMock.mockReturnValue({
      data: { admins: [], meta: {} },
      error: false,
      refetch: vi.fn(),
    });

    render(<Admins />);

    expect(screen.getByTestId("presenter")).toBeInTheDocument();
  });
});
