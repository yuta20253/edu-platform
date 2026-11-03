import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { TeachersTab } from "./TeachersTab";

const routerMock = { push: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

const showMock = vi.fn();
vi.mock("@/components/ui/ToastProvider", () => ({
  useToast: () => ({ show: showMock }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const gradesResponse = {
  data: { grades: [{ id: 1, year: 1, display_name: "高１生" }] },
};

describe("TeachersTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("データ取得中はスケルトンが表示される（スピナーは使わない）", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const { container } = render(<TeachersTab schoolId={1} />);

    expect(container.querySelector(".MuiSkeleton-root")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("教師が0人のとき空状態UIが表示される", async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/grades")) return Promise.resolve(gradesResponse);
      return Promise.resolve({ data: { teachers: [] } });
    });

    render(<TeachersTab schoolId={1} />);

    expect(await screen.findByText("教師がまだありません")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "最初の教師を追加する" }),
    ).toBeInTheDocument();
  });

  it("教師がいる場合は一覧テーブルが表示される", async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/grades")) return Promise.resolve(gradesResponse);
      return Promise.resolve({
        data: {
          teachers: [
            {
              id: 1,
              name: "田中太郎",
              email: "tanaka@example.com",
              grade_scope: "own_grade",
              manage_other_teachers: false,
              grades: [{ id: 1, name: "高１生" }],
            },
          ],
        },
      });
    });

    render(<TeachersTab schoolId={1} />);

    expect(await screen.findByText("田中太郎")).toBeInTheDocument();
    expect(screen.getByText("tanaka@example.com")).toBeInTheDocument();
  });

  it("「最初の教師を追加する」ボタンでドロワーが開き追加できる", async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/grades")) return Promise.resolve(gradesResponse);
      return Promise.resolve({ data: { teachers: [] } });
    });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { teacher: {} } });

    render(<TeachersTab schoolId={1} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "最初の教師を追加する" }),
    );

    expect(
      screen.getByRole("heading", { name: "教師を追加" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "姓" }), {
      target: { value: "田中" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "名" }), {
      target: { value: "太郎" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "メールアドレス" }), {
      target: { value: "tanaka@example.com" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "追加" }));
    });

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/admin/schools/1/teachers",
        expect.objectContaining({ name: "田中 太郎" }),
      ),
    );
  });

  it("教師行の編集ボタンで編集ドロワーが開く", async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/grades")) return Promise.resolve(gradesResponse);
      return Promise.resolve({
        data: {
          teachers: [
            {
              id: 1,
              name: "田中 太郎",
              email: "tanaka@example.com",
              grade_scope: "own_grade",
              manage_other_teachers: false,
              grades: [{ id: 1, name: "高１生" }],
            },
          ],
        },
      });
    });

    render(<TeachersTab schoolId={1} />);

    fireEvent.click(await screen.findByRole("button", { name: "編集" }));

    expect(
      screen.getByRole("heading", { name: "教師を編集" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "姓" })).toHaveValue("田中");
  });

  it("教師一覧の取得に失敗したらエラーを表示し、再試行で再取得する", async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/grades")) return Promise.resolve(gradesResponse);
      return Promise.reject({ response: { status: 500 } });
    });

    render(<TeachersTab schoolId={1} />);

    const callsBefore = vi.mocked(apiClient.get).mock.calls.length;
    fireEvent.click(await screen.findByRole("button", { name: "再試行" }));

    await waitFor(() =>
      expect(vi.mocked(apiClient.get).mock.calls.length).toBeGreaterThan(
        callsBefore,
      ),
    );
  });

  it("学年の取得に失敗したらトーストで通知する", async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/grades"))
        return Promise.reject({ response: { status: 500 } });
      return Promise.resolve({ data: { teachers: [] } });
    });

    render(<TeachersTab schoolId={1} />);

    await waitFor(() =>
      expect(showMock).toHaveBeenCalledWith({
        message: "学年の取得に失敗しました",
        severity: "error",
      }),
    );
  });

  it("教師を追加できたら「保存しました」のトーストを表示する", async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/grades")) return Promise.resolve(gradesResponse);
      return Promise.resolve({ data: { teachers: [] } });
    });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { teacher: {} } });

    render(<TeachersTab schoolId={1} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "最初の教師を追加する" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "姓" }), {
      target: { value: "田中" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "名" }), {
      target: { value: "太郎" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "メールアドレス" }), {
      target: { value: "tanaka@example.com" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "追加" }));
    });

    await waitFor(() =>
      expect(showMock).toHaveBeenCalledWith({ message: "保存しました" }),
    );
  });

  describe("編集の楽観ロック", () => {
    const teachersResponse = {
      data: {
        teachers: [
          {
            id: 1,
            name: "田中 太郎",
            email: "tanaka@example.com",
            grade_scope: "own_grade",
            manage_other_teachers: false,
            grades: [{ id: 1, name: "高１生" }],
            permission_lock_version: 7,
          },
          {
            id: 2,
            name: "鈴木 花子",
            email: "suzuki@example.com",
            grade_scope: "all_grades",
            manage_other_teachers: true,
            grades: [{ id: 1, name: "高１生" }],
            permission_lock_version: 2,
          },
        ],
      },
    };

    const teachersGetCount = () =>
      vi
        .mocked(apiClient.get)
        .mock.calls.filter(([url]) => !String(url).includes("/grades")).length;

    const openEditAndSave = async (index: number) => {
      fireEvent.click(
        (await screen.findAllByRole("button", { name: "編集" }))[index],
      );
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "保存" }));
      });
    };

    beforeEach(() => {
      vi.mocked(apiClient.get).mockImplementation((url: string) => {
        if (url.includes("/grades")) return Promise.resolve(gradesResponse);
        return Promise.resolve(teachersResponse);
      });
    });

    it("編集中の教師の permission_lock_version をPATCHで送る", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: { teacher: {} } });

      render(<TeachersTab schoolId={1} />);
      await openEditAndSave(0);

      await waitFor(() =>
        expect(apiClient.patch).toHaveBeenCalledWith(
          "/api/admin/schools/1/teachers/1",
          expect.objectContaining({ permission_lock_version: 7 }),
        ),
      );
    });

    it("409ならドロワーを閉じてエラーのトーストを出し、一覧を取り直す", async () => {
      vi.mocked(apiClient.patch).mockRejectedValue({
        response: {
          status: 409,
          data: {
            errors: [
              "他のユーザーによってデータが更新されています。再読み込みしてください",
            ],
          },
        },
      });

      render(<TeachersTab schoolId={1} />);
      await screen.findByText("田中 太郎");
      const countBefore = teachersGetCount();

      await openEditAndSave(0);

      await waitFor(() =>
        expect(showMock).toHaveBeenCalledWith({
          message:
            "ほかの人が先にこの教員の権限を変更しました。最新の内容で開き直してください",
          severity: "error",
        }),
      );
      await waitFor(() =>
        expect(
          screen.queryByRole("heading", { name: "教師を編集" }),
        ).not.toBeInTheDocument(),
      );
      await waitFor(() =>
        expect(teachersGetCount()).toBeGreaterThan(countBefore),
      );
    });

    it("409の後に別の教師を開いても、エラーの表示が残らない", async () => {
      vi.mocked(apiClient.patch).mockRejectedValue({
        response: { status: 409, data: { errors: ["競合"] } },
      });

      render(<TeachersTab schoolId={1} />);
      await openEditAndSave(0);
      await waitFor(() =>
        expect(
          screen.queryByRole("heading", { name: "教師を編集" }),
        ).not.toBeInTheDocument(),
      );

      fireEvent.click(
        (await screen.findAllByRole("button", { name: "編集" }))[1],
      );

      expect(screen.getByRole("textbox", { name: "姓" })).toHaveValue("鈴木");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
