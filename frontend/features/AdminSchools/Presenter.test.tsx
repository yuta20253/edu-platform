import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { AdminSchoolsData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockData: AdminSchoolsData = {
  schools: [
    {
      id: 1,
      name: "東京第一高校",
      prefecture_name: "東京都",
      student_count: 300,
      teacher_count: 20,
    },
    {
      id: 2,
      name: "大阪中央高校",
      prefecture_name: "大阪府",
      student_count: 250,
      teacher_count: 15,
    },
  ],
  meta: {
    current_page: 1,
    total_pages: 3,
    total_count: 50,
    per_page: 20,
  },
};

const mockPrefectures = [
  { id: 13, name: "東京都" },
  { id: 27, name: "大阪府" },
];

const defaultProps = {
  data: mockData,
  prefectures: mockPrefectures,
  selectedPrefectureId: null,
  page: 1,
  onPrefectureChange: vi.fn(),
  onPageChange: vi.fn(),
};

describe("AdminSchoolsPresenter", () => {
  it("テーブルヘッダーに「高校名」「都道府県」「生徒数」「教師数」「詳細」が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("高校名")).toBeInTheDocument();
    expect(screen.getByText("都道府県")).toBeInTheDocument();
    expect(screen.getByText("生徒数")).toBeInTheDocument();
    expect(screen.getByText("教師数")).toBeInTheDocument();
    expect(screen.getByText("詳細")).toBeInTheDocument();
  });

  it("schools データが行として正しくレンダリングされる", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("東京第一高校")).toBeInTheDocument();
    expect(screen.getByText("東京都")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("大阪中央高校")).toBeInTheDocument();
    expect(screen.getByText("大阪府")).toBeInTheDocument();
  });

  it("都道府県プルダウンに「すべて」オプションが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("すべて")).toBeInTheDocument();
  });

  it("ページネーションが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("「詳細」リンクが /admin/schools/[id] を指している", () => {
    render(<Presenter {...defaultProps} />);
    const detailLinks = screen.getAllByRole("link", { name: "詳細" });
    expect(detailLinks[0]).toHaveAttribute("href", "/admin/schools/1");
    expect(detailLinks[1]).toHaveAttribute("href", "/admin/schools/2");
  });

  it("schools が空のとき「高校が見つかりません」が表示される", () => {
    render(
      <Presenter
        {...defaultProps}
        data={{ ...mockData, schools: [] }}
      />,
    );
    expect(screen.getByText("高校が見つかりません")).toBeInTheDocument();
  });
});
