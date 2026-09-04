import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Presenter } from "./Presenter";
import { MeUser } from "@/types/common/me";

const mockUser: MeUser = {
  id: 1,
  name: "山田太郎",
  name_kana: "ヤマダタロウ",
  email: "yamada@example.com",
  profile_completed: true,
  user_personal_info: {
    id: 10,
    phone_number: "09012345678",
    birthday: "2005-04-01",
    gender: "male",
  },
  user_role: { name: "student" },
  high_school: { name: "東京第一高校" },
  grade: { year: 2, display_name: "高校2年" },
  address: {
    id: 5,
    postal_code: "1000001",
    city: "千代田区",
    town: "千代田",
    street_address: "1-1",
    prefecture: { id: 13, name: "東京都" },
  },
};

describe("UserProfilePresenter", () => {
  it("氏名・氏名カナ・生年月日・性別・電話番号・住所・在籍高校・学年が表示される", () => {
    render(<Presenter user={mockUser} />);
    expect(screen.getByText("山田太郎")).toBeInTheDocument();
    expect(screen.getByText("ヤマダタロウ")).toBeInTheDocument();
    expect(screen.getByText("2005-04-01")).toBeInTheDocument();
    expect(screen.getByText("男")).toBeInTheDocument();
    expect(screen.getByText("09012345678")).toBeInTheDocument();
    expect(screen.getByText("東京都千代田区千代田")).toBeInTheDocument();
    expect(screen.getByText("東京第一高校")).toBeInTheDocument();
    expect(screen.getByText("高校2年")).toBeInTheDocument();
  });

  it("性別が female のとき「女」と表示される", () => {
    render(
      <Presenter
        user={{
          ...mockUser,
          user_personal_info: {
            ...mockUser.user_personal_info!,
            gender: "female",
          },
        }}
      />,
    );
    expect(screen.getByText("女")).toBeInTheDocument();
  });

  it("未設定の項目は「未設定」と表示される", () => {
    render(
      <Presenter
        user={{
          ...mockUser,
          user_personal_info: undefined,
          address: undefined,
          high_school: undefined,
          grade: undefined,
        }}
      />,
    );
    expect(screen.getAllByText("未設定").length).toBe(6);
  });

  it("「戻る」リンクが / を指している", () => {
    render(<Presenter user={mockUser} />);
    expect(screen.getByRole("link", { name: "戻る" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("「編集する」リンクが /profile/edit を指している", () => {
    render(<Presenter user={mockUser} />);
    expect(screen.getByRole("link", { name: "編集する" })).toHaveAttribute(
      "href",
      "/profile/edit",
    );
  });
});
