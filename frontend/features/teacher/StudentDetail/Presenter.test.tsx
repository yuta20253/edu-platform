import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { Student } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockStudent: Student = {
  id: 1,
  name: "山田太郎",
  name_kana: "ヤマダタロウ",
  email: "yamada@example.com",
  profile_completed: true,
  user_personal_info: {
    id: 10,
    phone_number: "09012345678",
    birthday: "2008-04-01",
    gender: "male",
  },
  high_school: { name: "東京第一高校" },
  address: {
    id: 5,
    postal_code: "1000001",
    city: "千代田区",
    town: "千代田",
    prefecture: { id: 13, name: "東京都" },
  },
  grade: { year: 1, display_name: "高校1年" },
};

describe("StudentDetailPresenter", () => {
  it("基本情報が表示される", () => {
    render(<Presenter student={mockStudent} />);
    expect(screen.getByText("生徒詳細")).toBeInTheDocument();
    expect(screen.getByText("山田太郎")).toBeInTheDocument();
    expect(screen.getByText("ヤマダタロウ")).toBeInTheDocument();
    expect(screen.getByText("yamada@example.com")).toBeInTheDocument();
    expect(screen.getByText("高校1年")).toBeInTheDocument();
    expect(screen.getByText("東京第一高校")).toBeInTheDocument();
  });

  it("プロフィール完了時は「入力完了」バッジが表示される", () => {
    render(<Presenter student={mockStudent} />);
    expect(screen.getByText("入力完了")).toBeInTheDocument();
  });

  it("プロフィール未完了時は「未完了」バッジが表示される", () => {
    render(
      <Presenter student={{ ...mockStudent, profile_completed: false }} />,
    );
    expect(screen.getByText("未完了")).toBeInTheDocument();
  });

  it("個人情報（生年月日・性別・電話番号・住所）が表示される", () => {
    render(<Presenter student={mockStudent} />);
    expect(screen.getByText("2008-04-01")).toBeInTheDocument();
    expect(screen.getByText("男性")).toBeInTheDocument();
    expect(screen.getByText("09012345678")).toBeInTheDocument();
    expect(
      screen.getByText("〒1000001 東京都千代田区千代田"),
    ).toBeInTheDocument();
  });

  it("性別が female のとき「女性」と表示される", () => {
    render(
      <Presenter
        student={{
          ...mockStudent,
          user_personal_info: {
            ...mockStudent.user_personal_info!,
            gender: "female",
          },
        }}
      />,
    );
    expect(screen.getByText("女性")).toBeInTheDocument();
  });

  it("user_personal_info が未設定のとき生年月日・電話番号・性別が「未設定」になる", () => {
    render(
      <Presenter student={{ ...mockStudent, user_personal_info: undefined }} />,
    );
    expect(screen.getAllByText("未設定").length).toBeGreaterThanOrEqual(2);
  });

  it("address が未設定のとき住所が「未設定」になる", () => {
    render(<Presenter student={{ ...mockStudent, address: undefined }} />);
    expect(screen.getByText("未設定")).toBeInTheDocument();
  });

  it("「一覧へ戻る」リンクが /teacher/students を指している", () => {
    render(<Presenter student={mockStudent} />);
    expect(screen.getByRole("link", { name: "一覧へ戻る" })).toHaveAttribute(
      "href",
      "/teacher/students",
    );
  });
});
