import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { CreateInterview } from "./index";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/components/ui/ToastProvider", () => ({
  useToast: () => ({ show: vi.fn() }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

type PresenterProps = {
  studentOptions: { id: number; name: string }[];
  searchError: boolean;
  initialStudent: { id: number; name: string } | null;
  onKeywordChange: (keyword: string) => void;
};

vi.mock("./Presenter", () => ({
  Presenter: ({
    studentOptions,
    searchError,
    initialStudent,
    onKeywordChange,
  }: PresenterProps) => (
    <div>
      <span>
        {`申請フォーム 候補:${studentOptions.map((s) => s.name).join(",")} 初期:${initialStudent?.name ?? "なし"} 検索失敗:${searchError}`}
      </span>
      <button onClick={() => onKeywordChange("山田")}>山田で検索</button>
    </div>
  ),
}));

const studentsResponse = {
  data: {
    students: [{ id: 1, name: "山田太郎", name_kana: "ヤマダタロウ" }],
    meta: { current_page: 1, total_pages: 1, total_count: 1, per_page: 20 },
  },
};

const studentResponse = {
  data: { id: 150, name: "鈴木一郎", name_kana: "スズキイチロウ" },
};

// 生徒検索と初期選択の生徒取得を URL で振り分ける
const mockGet = (handlers: {
  students?: () => Promise<unknown>;
  student?: () => Promise<unknown>;
}) =>
  vi.mocked(apiClient.get).mockImplementation((url: string) => {
    if (url === "/api/teacher/students") {
      return (handlers.students ?? (() => Promise.resolve(studentsResponse)))();
    }
    return (handlers.student ?? (() => Promise.resolve(studentResponse)))();
  });

describe("teacher/CreateInterview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockReset();
  });

  it("初期選択の生徒が無いときは、すぐにフォームを出して生徒候補を渡す", async () => {
    mockGet({});
    render(<CreateInterview />);

    expect(
      await screen.findByText(
        "申請フォーム 候補:山田太郎 初期:なし 検索失敗:false",
      ),
    ).toBeInTheDocument();
  });

  it("初期選択の生徒を取得するまではスピナーを出し、取得したらフォームに渡す", async () => {
    let resolveStudent: (value: unknown) => void = () => {};
    mockGet({
      student: () => new Promise((resolve) => (resolveStudent = resolve)),
    });
    render(<CreateInterview initialStudentId={150} />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText(/申請フォーム/)).not.toBeInTheDocument();

    resolveStudent(studentResponse);

    expect(await screen.findByText(/初期:鈴木一郎/)).toBeInTheDocument();
    expect(
      vi
        .mocked(apiClient.get)
        .mock.calls.some(([url]) => url === "/api/teacher/students/150"),
    ).toBe(true);
  });

  it("初期選択の生徒を取得できないときは、未選択のフォームを出す", async () => {
    mockGet({ student: () => Promise.reject({ response: { status: 404 } }) });
    render(<CreateInterview initialStudentId={999} />);

    expect(await screen.findByText(/初期:なし/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("生徒の検索に失敗したときは、フォームを出したまま失敗を渡す", async () => {
    mockGet({ students: () => Promise.reject({ response: { status: 500 } }) });
    render(<CreateInterview />);

    expect(await screen.findByText(/検索失敗:true/)).toBeInTheDocument();
  });

  it("キーワードを入力すると、入力が止まってからキーワード付きで検索する", async () => {
    mockGet({});
    render(<CreateInterview />);
    await screen.findByText(/申請フォーム/);

    fireEvent.click(screen.getByRole("button", { name: "山田で検索" }));

    await waitFor(() =>
      expect(vi.mocked(apiClient.get).mock.lastCall?.[1]?.params).toEqual({
        page: "1",
        per_page: "20",
        keyword: "山田",
      }),
    );
  });

  it("401のときは/loginに遷移する", async () => {
    mockGet({ students: () => Promise.reject({ response: { status: 401 } }) });
    render(<CreateInterview />);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
