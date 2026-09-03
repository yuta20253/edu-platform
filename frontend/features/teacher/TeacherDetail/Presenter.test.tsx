import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { Teacher } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockTeacher: Teacher = {
  id: 1,
  name: "山田太郎",
  name_kana: "ヤマダタロウ",
  grade: { year: 1, display_name: "1年A組" },
  teacher_permission: {
    id: 1,
    grade_scope: 1,
    manage_other_teachers: true,
  },
  user_personal_info: {
    id: 10,
    phone_number: "08012345678",
    birthday: "1999-01-01",
    gender: "male",
  },
  address: {
    id: 5,
    postal_code: "1000001",
    city: "千代田区",
    town: "千代田",
    street_address: "1-1-1",
    prefecture: { id: 13, name: "東京都" },
  },
};

describe("ColleagueDetailPresenter", () => {
  it("氏名・氏名カナ・担当学年が表示される", () => {
    render(<Presenter teacher={mockTeacher} />);
    expect(screen.getByText("山田太郎")).toBeInTheDocument();
    expect(screen.getByText("ヤマダタロウ")).toBeInTheDocument();
    expect(screen.getByText("1年A組")).toBeInTheDocument();
  });

  it("grade_scope が truthy のとき「自学年」、falsy のとき「全学年」が表示される", () => {
    const { rerender } = render(<Presenter teacher={mockTeacher} />);
    expect(screen.getByText("自学年")).toBeInTheDocument();

    rerender(
      <Presenter
        teacher={{
          ...mockTeacher,
          teacher_permission: {
            ...mockTeacher.teacher_permission,
            grade_scope: 0,
          },
        }}
      />,
    );
    expect(screen.getByText("全学年")).toBeInTheDocument();
  });

  it("manage_other_teachers が true のとき「有」、false のとき「無」が表示される", () => {
    const { rerender } = render(<Presenter teacher={mockTeacher} />);
    expect(screen.getByText("有")).toBeInTheDocument();

    rerender(
      <Presenter
        teacher={{
          ...mockTeacher,
          teacher_permission: {
            ...mockTeacher.teacher_permission,
            manage_other_teachers: false,
          },
        }}
      />,
    );
    expect(screen.getByText("無")).toBeInTheDocument();
  });

  it("個人情報(生年月日・性別・電話番号・住所)が表示される", () => {
    render(<Presenter teacher={mockTeacher} />);
    expect(screen.getByText("1999-01-01")).toBeInTheDocument();
    expect(screen.getByText("男")).toBeInTheDocument();
    expect(screen.getByText("08012345678")).toBeInTheDocument();
    expect(screen.getByText("東京都千代田区千代田")).toBeInTheDocument();
  });

  it("性別が female のとき「女」、other のとき「その他」が表示される", () => {
    const { rerender } = render(
      <Presenter
        teacher={{
          ...mockTeacher,
          user_personal_info: {
            ...mockTeacher.user_personal_info!,
            gender: "female",
          },
        }}
      />,
    );
    expect(screen.getByText("女")).toBeInTheDocument();

    rerender(
      <Presenter
        teacher={{
          ...mockTeacher,
          user_personal_info: {
            ...mockTeacher.user_personal_info!,
            gender: "other",
          },
        }}
      />,
    );
    expect(screen.getByText("その他")).toBeInTheDocument();
  });

  it("個人情報・住所が未設定のとき「未設定」が表示される", () => {
    render(
      <Presenter
        teacher={{
          ...mockTeacher,
          user_personal_info: undefined,
          address: undefined,
        }}
      />,
    );
    expect(screen.getAllByText("未設定").length).toBe(4);
  });

  it("「一覧へ戻る」リンクが /teacher/colleagues を指している", () => {
    render(<Presenter teacher={mockTeacher} />);
    expect(screen.getByRole("link", { name: "一覧へ戻る" })).toHaveAttribute(
      "href",
      "/teacher/colleagues",
    );
  });
});
