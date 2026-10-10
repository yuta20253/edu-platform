import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";
import { apiClient } from "@/libs/http/apiClient";
import { TargetPicker } from "./TargetPicker";
import type {
  AnnouncementFormValues,
  AnnouncementTargetOptions,
} from "../types";

const routerMock = { push: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const options: AnnouncementTargetOptions = {
  grades: [{ id: 1, year: 1, display_name: "1年" }],
  user_roles: [
    { id: 1, name: "student" },
    { id: 2, name: "teacher" },
  ],
  students: {
    items: [
      {
        id: 10,
        name: "山田太郎",
        name_kana: "ヤマダタロウ",
        grade: { display_name: "1年" },
      },
    ],
    meta: { current_page: 1, total_pages: 1, total_count: 1, per_page: 20 },
  },
  own_grade_restriction: null,
};

const satoOptions: AnnouncementTargetOptions = {
  ...options,
  students: {
    ...options.students,
    items: [
      {
        id: 11,
        name: "佐藤花子",
        name_kana: "サトウハナコ",
        grade: { display_name: "1年" },
      },
    ],
  },
};

// 生徒検索APIのモック。keyword「佐藤」なら佐藤花子、それ以外は山田太郎を返す
const mockStudentSearch = (base: AnnouncementTargetOptions = options) => {
  vi.mocked(apiClient.get).mockImplementation(async (_url, config) => {
    const keyword = (config?.params as { keyword?: string } | undefined)
      ?.keyword;
    return { data: keyword === "佐藤" ? satoOptions : base };
  });
};

const Host = ({
  defaultValues,
  opts = options,
}: {
  defaultValues: AnnouncementFormValues;
  opts?: AnnouncementTargetOptions | null;
}) => {
  const { control, watch } = useForm<AnnouncementFormValues>({
    defaultValues,
  });
  return (
    <>
      <pre data-testid="targets">{JSON.stringify(watch("targets"))}</pre>
      <TargetPicker control={control} options={opts} />
    </>
  );
};

const currentTargets = () =>
  JSON.parse(screen.getByTestId("targets").textContent ?? "[]");

const baseValues: AnnouncementFormValues = {
  title: "",
  content: "",
  targets: [{ target_type: "all_users" }],
  deliveryTiming: "draft",
  scheduledAt: null,
};

describe("TargetPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStudentSearch();
  });

  it("初期状態で1行表示され、配信先の種類は「全員」になっている", () => {
    render(<Host defaultValues={baseValues} />);
    expect(
      screen.getByRole("combobox", { name: "配信先の種類" }),
    ).toHaveTextContent("全員");
  });

  it("配信先の種類で「学年別」を選ぶと学年のセレクトが表示される", () => {
    render(<Host defaultValues={baseValues} />);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "配信先の種類" }));
    fireEvent.click(screen.getByRole("option", { name: "学年別" }));

    expect(screen.getByRole("combobox", { name: "学年" })).toBeInTheDocument();
  });

  it("配信先の種類で「学年別」を選ぶと権限のセレクトも表示され、選んだ学年と権限が値に入る", () => {
    render(<Host defaultValues={baseValues} />);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "配信先の種類" }));
    fireEvent.click(screen.getByRole("option", { name: "学年別" }));

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "学年" }));
    fireEvent.click(screen.getByRole("option", { name: "1年" }));
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "権限" }));
    fireEvent.click(screen.getByRole("option", { name: "生徒" }));

    expect(currentTargets()).toEqual([
      { target_type: "by_grade", grade_id: 1, user_role_id: 1 },
    ]);
  });

  it("配信先の種類で「権限別」を選ぶと権限のセレクトが日本語ラベルで表示される", () => {
    render(<Host defaultValues={baseValues} />);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "配信先の種類" }));
    fireEvent.click(screen.getByRole("option", { name: "権限別" }));

    expect(screen.getByRole("combobox", { name: "権限" })).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "権限" }));
    expect(screen.getByRole("option", { name: "生徒" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "教員" })).toBeInTheDocument();
    expect(screen.queryByText("student")).not.toBeInTheDocument();
    expect(screen.queryByText("teacher")).not.toBeInTheDocument();
  });

  it("配信先の種類を変えると、前の種類で選んだ値がリセットされる", () => {
    render(
      <Host
        defaultValues={{
          ...baseValues,
          targets: [{ target_type: "by_user", user_id: 10 }],
        }}
      />,
    );
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "配信先の種類" }));
    fireEvent.click(screen.getByRole("option", { name: "全員" }));

    expect(currentTargets()).toEqual([{ target_type: "all_users" }]);
  });

  it("「配信先を追加」ボタンで行が増える", () => {
    render(<Host defaultValues={baseValues} />);
    fireEvent.click(screen.getByRole("button", { name: "配信先を追加" }));

    expect(
      screen.getAllByRole("combobox", { name: "配信先の種類" }),
    ).toHaveLength(2);
  });

  it("own_grade_restrictionがある場合、配信先の種類は「学年別」「個人」のみ選択できる", () => {
    render(
      <Host
        defaultValues={baseValues}
        opts={{ ...options, own_grade_restriction: 1 }}
      />,
    );
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "配信先の種類" }));

    expect(screen.getByRole("option", { name: "学年別" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "個人" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "全員" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "権限別" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "学校全体" }),
    ).not.toBeInTheDocument();
  });

  it("own_grade_restrictionがある場合、選択できない種類(初期値の全員)は自動的に学年別へ補正される", () => {
    render(
      <Host
        defaultValues={baseValues}
        opts={{ ...options, own_grade_restriction: 1 }}
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "配信先の種類" }),
    ).toHaveTextContent("学年別");
  });

  it("「個人」では生徒を検索して選択でき、選んだ生徒のuser_idが値に入る", async () => {
    render(
      <Host
        defaultValues={{ ...baseValues, targets: [{ target_type: "by_user" }] }}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "生徒を検索" }), {
      target: { value: "佐藤" },
    });
    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/teacher/announcements/new",
        expect.objectContaining({ params: { page: "1", keyword: "佐藤" } }),
      ),
    );

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "生徒" }));
    fireEvent.click(
      await screen.findByRole("option", { name: "佐藤花子(1年)" }),
    );

    expect(currentTargets()).toEqual([{ target_type: "by_user", user_id: 11 }]);
  });

  it("「個人」の行ごとに検索キーワードは独立している", async () => {
    render(
      <Host
        defaultValues={{
          ...baseValues,
          targets: [{ target_type: "by_user" }, { target_type: "by_user" }],
        }}
      />,
    );
    const [first, second] = screen.getAllByRole("textbox", {
      name: "生徒を検索",
    });

    fireEvent.change(first, { target: { value: "佐藤" } });

    expect(first).toHaveValue("佐藤");
    expect(second).toHaveValue("");
    // 1行目だけがキーワード付きで検索する
    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/teacher/announcements/new",
        expect.objectContaining({ params: { page: "1", keyword: "佐藤" } }),
      ),
    );
    expect(
      vi
        .mocked(apiClient.get)
        .mock.calls.filter(([, config]) => config?.params?.keyword === "佐藤"),
    ).toHaveLength(1);
  });

  it("生徒を選んだ後に別のキーワードで検索して一覧から消えても、選択済みの生徒名は表示されたまま", async () => {
    render(
      <Host
        defaultValues={{ ...baseValues, targets: [{ target_type: "by_user" }] }}
      />,
    );
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "生徒" }));
    fireEvent.click(
      await screen.findByRole("option", { name: "山田太郎(1年)" }),
    );

    fireEvent.change(screen.getByRole("textbox", { name: "生徒を検索" }), {
      target: { value: "佐藤" },
    });
    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/teacher/announcements/new",
        expect.objectContaining({ params: { page: "1", keyword: "佐藤" } }),
      ),
    );

    expect(screen.getByRole("combobox", { name: "生徒" })).toHaveTextContent(
      "山田太郎(1年)",
    );
    expect(currentTargets()).toEqual([{ target_type: "by_user", user_id: 10 }]);
  });

  it("生徒が複数ページある場合、次へ/前へボタンでページを切り替えて検索する", async () => {
    mockStudentSearch({
      ...options,
      students: {
        ...options.students,
        meta: {
          current_page: 1,
          total_pages: 2,
          total_count: 21,
          per_page: 20,
        },
      },
    });
    render(
      <Host
        defaultValues={{ ...baseValues, targets: [{ target_type: "by_user" }] }}
      />,
    );

    expect(await screen.findByRole("button", { name: "前へ" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/teacher/announcements/new",
        expect.objectContaining({ params: { page: "2" } }),
      ),
    );
  });

  it("生徒が1ページのみの場合、次へ/前へボタンは表示されない", async () => {
    render(
      <Host
        defaultValues={{ ...baseValues, targets: [{ target_type: "by_user" }] }}
      />,
    );
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());

    expect(
      screen.queryByRole("button", { name: "次へ" }),
    ).not.toBeInTheDocument();
  });

  it("行の「削除」ボタンで行が減る", () => {
    render(
      <Host
        defaultValues={{
          ...baseValues,
          targets: [{ target_type: "all_users" }, { target_type: "by_school" }],
        }}
      />,
    );
    expect(
      screen.getAllByRole("combobox", { name: "配信先の種類" }),
    ).toHaveLength(2);

    fireEvent.click(screen.getAllByRole("button", { name: "削除" })[0]);

    expect(
      screen.getAllByRole("combobox", { name: "配信先の種類" }),
    ).toHaveLength(1);
  });
});
