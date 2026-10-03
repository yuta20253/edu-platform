import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";
import { TargetPicker } from "./TargetPicker";
import type {
  AnnouncementFormValues,
  AnnouncementTargetOptions,
} from "../types";

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

const Host = ({
  defaultValues,
  onStudentKeywordChange = vi.fn(),
  opts = options,
}: {
  defaultValues: AnnouncementFormValues;
  onStudentKeywordChange?: (keyword: string) => void;
  opts?: AnnouncementTargetOptions | null;
}) => {
  const { control } = useForm<AnnouncementFormValues>({ defaultValues });
  return (
    <TargetPicker
      control={control}
      options={opts}
      studentKeyword=""
      onStudentKeywordChange={onStudentKeywordChange}
    />
  );
};

const baseValues: AnnouncementFormValues = {
  title: "",
  content: "",
  targets: [{ target_type: "all_users" }],
  deliveryTiming: "draft",
  scheduledAt: null,
};

describe("TargetPicker", () => {
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

  it("配信先の種類で「権限別」を選ぶと権限のセレクトが表示される", () => {
    render(<Host defaultValues={baseValues} />);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "配信先の種類" }));
    fireEvent.click(screen.getByRole("option", { name: "権限別" }));

    expect(screen.getByRole("combobox", { name: "権限" })).toBeInTheDocument();
  });

  it("配信先の種類で「個人」を選ぶと生徒検索欄が表示され、入力するとonStudentKeywordChangeが呼ばれる", () => {
    const onStudentKeywordChange = vi.fn();
    render(
      <Host
        defaultValues={baseValues}
        onStudentKeywordChange={onStudentKeywordChange}
      />,
    );
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "配信先の種類" }));
    fireEvent.click(screen.getByRole("option", { name: "個人" }));

    fireEvent.change(screen.getByRole("textbox", { name: "生徒を検索" }), {
      target: { value: "山田" },
    });

    expect(onStudentKeywordChange).toHaveBeenCalledWith("山田");
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

    expect(screen.getByRole("combobox", { name: "配信先の種類" })).toHaveTextContent(
      "学年別",
    );
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
