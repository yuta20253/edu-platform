import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { Permissions } from "./index";
import type { PermissionTeacherDetail, PermissionsData } from "./types";

// 編集ドロワーの作り直し(key)を確かめるため、Presenter をモックせずに画面全体を描画する

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

// 一覧の行の値。開いたときに取り直す値とわざと違えておく(行の値で初期化していたら気づける)
const list: PermissionsData = {
  current_user: {
    id: 1,
    name: "山田太郎",
    name_kana: "ヤマダタロウ",
    grade: { year: 1, display_name: "1年" },
    invitation_status: "sent",
    teacher_permission: {
      id: 1,
      grade_scope: "all_grades",
      manage_other_teachers: true,
    },
  },
  teachers: [
    {
      id: 2,
      name: "鈴木花子",
      teacher_permission: {
        id: 2,
        grade_scope: "own_grade",
        manage_other_teachers: false,
      },
    },
    {
      id: 3,
      name: "佐藤次郎",
      teacher_permission: {
        id: 3,
        grade_scope: "own_grade",
        manage_other_teachers: false,
      },
    },
  ],
  meta: { current_page: 1, total_pages: 1, total_count: 2, per_page: 20 },
};

const detail = (
  id: number,
  name: string,
  permission: Partial<PermissionTeacherDetail["teacher_permission"]>,
): PermissionTeacherDetail => ({
  id,
  name,
  teacher_permission: {
    id,
    grade_scope: "all_grades",
    manage_other_teachers: true,
    lock_version: 1,
    ...permission,
  },
});

// url ごとに、呼ばれた回数に応じたレスポンスを返す
function mockGet(details: Record<string, PermissionTeacherDetail[]>) {
  const counts: Record<string, number> = {};
  vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
    if (url === "/api/teacher/permissions") return { data: list };
    const responses = details[url];
    if (!responses) throw new Error(`unexpected url: ${url}`);
    const index = Math.min(counts[url] ?? 0, responses.length - 1);
    counts[url] = (counts[url] ?? 0) + 1;
    return { data: responses[index] };
  });
}

const detailCalls = (url: string) =>
  vi.mocked(apiClient.get).mock.calls.filter(([calledUrl]) => calledUrl === url)
    .length;

const clickEdit = async (name: string) => {
  const row = (await screen.findByText(name)).closest("tr")!;
  fireEvent.click(within(row).getByRole("button", { name: "編集" }));
};

describe("教員権限の編集の流れ", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("編集を押すと、一覧の行ではなく取り直した最新の値でフォームが出る", async () => {
    mockGet({
      "/api/teacher/permissions/2": [
        detail(2, "鈴木花子", { grade_scope: "all_grades" }),
      ],
    });
    render(<Permissions />);

    await clickEdit("鈴木花子");

    expect(await screen.findByRole("radio", { name: "全学年" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "有" })).toBeChecked();
  });

  it("409 のときは案内を出したまま、最新の値と lock_version を取り直してフォームを作り直す", async () => {
    mockGet({
      "/api/teacher/permissions/2": [
        detail(2, "鈴木花子", { grade_scope: "all_grades", lock_version: 1 }),
        // ほかの人が先に「自学年・無」に変えていた
        detail(2, "鈴木花子", {
          grade_scope: "own_grade",
          manage_other_teachers: false,
          lock_version: 2,
        }),
      ],
    });
    vi.mocked(apiClient.patch).mockRejectedValue({
      response: { status: 409, data: { errors: ["競合"] } },
    });
    render(<Permissions />);

    await clickEdit("鈴木花子");
    await screen.findByRole("radio", { name: "全学年" });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(detailCalls("/api/teacher/permissions/2")).toBe(2),
    );
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "自学年" })).toBeChecked(),
    );
    expect(screen.getByRole("radio", { name: "無" })).toBeChecked();
    expect(
      screen.getByText(
        "ほかの人が先にこの教員の権限を変更しました。最新の内容を確認して、保存し直してください",
      ),
    ).toBeInTheDocument();
    // 一覧も取り直す
    expect(detailCalls("/api/teacher/permissions")).toBe(2);

    // 作り直したフォームから保存すると、新しい lock_version を送る
    vi.mocked(apiClient.patch).mockResolvedValue({});
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenLastCalledWith(
        "/api/teacher/permissions/2",
        {
          teacher_permission: {
            grade_scope: "own_grade",
            manage_other_teachers: false,
            lock_version: 2,
          },
        },
      ),
    );
  });

  it("A を開いて閉じ、すぐ B を開くと、B の値でフォームが初期化される", async () => {
    mockGet({
      "/api/teacher/permissions/2": [
        detail(2, "鈴木花子", { grade_scope: "all_grades" }),
      ],
      "/api/teacher/permissions/3": [
        detail(3, "佐藤次郎", {
          grade_scope: "own_grade",
          manage_other_teachers: true,
        }),
      ],
    });
    render(<Permissions />);

    await clickEdit("鈴木花子");
    await screen.findByRole("radio", { name: "全学年" });
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    await clickEdit("佐藤次郎");

    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "自学年" })).toBeChecked(),
    );
    expect(screen.getByRole("radio", { name: "有" })).toBeChecked();
  });

  it("同じ教員を開き直すと、権限をもう一度取得する", async () => {
    mockGet({
      "/api/teacher/permissions/2": [detail(2, "鈴木花子", {})],
    });
    render(<Permissions />);

    await clickEdit("鈴木花子");
    await screen.findByRole("radio", { name: "全学年" });
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    await clickEdit("鈴木花子");

    await waitFor(() =>
      expect(detailCalls("/api/teacher/permissions/2")).toBe(2),
    );
  });
});
