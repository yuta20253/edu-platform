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

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const gradesResponse = {
  data: { grades: [{ id: 1, name: "高１生" }] },
};

describe("TeachersTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("教師が0人のとき空状態UIが表示される", async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/grades")) return Promise.resolve(gradesResponse);
      return Promise.resolve({ data: { teachers: [] } });
    });

    render(<TeachersTab schoolId={1} />);

    expect(
      await screen.findByText("まだ教師が登録されていません"),
    ).toBeInTheDocument();
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
    fireEvent.change(screen.getByRole("textbox", { name: "初期パスワード" }), {
      target: { value: "abc123xyz" },
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
});
