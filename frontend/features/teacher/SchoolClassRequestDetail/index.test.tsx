import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSchoolClassRequestDetail } from "./hooks/useSchoolClassRequestDetail";
import { SchoolClassRequestDetail } from "./index";

vi.mock("./hooks/useSchoolClassRequestDetail", () => ({
  useSchoolClassRequestDetail: vi.fn(),
}));

vi.mock("./Presenter", () => ({
  Presenter: ({
    request,
    refreshError,
  }: {
    request: { name: string };
    refreshError: boolean;
  }) => (
    <div>
      {request.name}の申請詳細
      {refreshError && <span>取り直しの失敗</span>}
    </div>
  ),
}));

type HookResult = ReturnType<typeof useSchoolClassRequestDetail>;

const retry = vi.fn();
const hookResult = (overrides: Partial<HookResult> = {}) =>
  ({
    request: null,
    error: false,
    retry,
    approve: vi.fn(),
    reject: vi.fn(),
    cancel: vi.fn(),
    actionError: "",
    clearActionError: vi.fn(),
    ...overrides,
  }) as HookResult;

const loadedRequest = { name: "4組" } as HookResult["request"];

describe("teacher/SchoolClassRequestDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("指定した学級申請を取得する", () => {
    vi.mocked(useSchoolClassRequestDetail).mockReturnValue(hookResult());
    render(<SchoolClassRequestDetail schoolClassRequestId={5} />);

    expect(useSchoolClassRequestDetail).toHaveBeenCalledWith(5);
  });

  it("取得中はスピナーを表示し、エラーは表示しない", () => {
    vi.mocked(useSchoolClassRequestDetail).mockReturnValue(hookResult());
    render(<SchoolClassRequestDetail schoolClassRequestId={1} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("取得に成功すると画面を表示する", () => {
    vi.mocked(useSchoolClassRequestDetail).mockReturnValue(
      hookResult({ request: loadedRequest }),
    );
    render(<SchoolClassRequestDetail schoolClassRequestId={1} />);

    expect(screen.getByText("4組の申請詳細")).toBeInTheDocument();
  });

  it("取得に失敗するとエラーを表示し、再試行で取り直す", () => {
    vi.mocked(useSchoolClassRequestDetail).mockReturnValue(
      hookResult({ error: true }),
    );
    render(<SchoolClassRequestDetail schoolClassRequestId={1} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(retry).toHaveBeenCalled();
  });

  it("取得済みの申請があるときの失敗(操作の後の取り直しなど)は、画面全体をエラーにせず画面の中で知らせる", () => {
    vi.mocked(useSchoolClassRequestDetail).mockReturnValue(
      hookResult({ request: loadedRequest, error: true }),
    );
    render(<SchoolClassRequestDetail schoolClassRequestId={1} />);

    expect(screen.getByText(/4組の申請詳細/)).toBeInTheDocument();
    expect(screen.getByText("取り直しの失敗")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
