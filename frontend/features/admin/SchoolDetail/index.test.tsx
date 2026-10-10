import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SchoolDetail } from "./index";

const useSchoolDetailMock = vi.fn();

vi.mock("./hooks", () => ({
  useSchoolDetail: () => useSchoolDetailMock(),
}));

vi.mock("./Presenter", () => ({
  Presenter: () => <div data-testid="presenter" />,
}));

describe("SchoolDetail", () => {
  beforeEach(() => {
    useSchoolDetailMock.mockReset();
  });

  it("取得に失敗したらエラーを表示し、再試行で retry が呼ばれる", () => {
    const retry = vi.fn();
    useSchoolDetailMock.mockReturnValue({ school: null, error: true, retry });

    render(<SchoolDetail schoolId={1} />);

    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("取得中は Presenter を表示しない", () => {
    useSchoolDetailMock.mockReturnValue({ school: null, error: false });

    render(<SchoolDetail schoolId={1} />);

    expect(screen.queryByTestId("presenter")).not.toBeInTheDocument();
  });

  it("データがあれば Presenter を表示する", () => {
    useSchoolDetailMock.mockReturnValue({ school: { id: 1 }, error: false });

    render(<SchoolDetail schoolId={1} />);

    expect(screen.getByTestId("presenter")).toBeInTheDocument();
  });
});
