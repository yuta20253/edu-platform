import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { GradeWithSchoolClasses } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockData: GradeWithSchoolClasses[] = [
  {
    id: 1,
    year: 1,
    display_name: "高校1年",
    school_classes: [
      { id: 10, name: "1組" },
      { id: 11, name: "2組" },
    ],
  },
  {
    id: 2,
    year: 2,
    display_name: "高校2年",
    school_classes: [],
  },
];

describe("SchoolClassesPresenter", () => {
  it("見出しと件数が表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("学級一覧")).toBeInTheDocument();
    expect(screen.getByText("2件")).toBeInTheDocument();
  });

  it("テーブルヘッダーに「クラス名」「詳細」が表示される", () => {
    render(<Presenter data={mockData} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toContain("クラス名");
    expect(headers).toContain("詳細");
  });

  it("学年の区切りが見出し行として表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("高校1年")).toBeInTheDocument();
  });

  it("クラス名が行として表示される", () => {
    render(<Presenter data={mockData} />);
    expect(screen.getByText("1組")).toBeInTheDocument();
    expect(screen.getByText("2組")).toBeInTheDocument();
  });

  it("「詳細」リンクが /teacher/school-classes/[id] を指している", () => {
    render(<Presenter data={mockData} />);
    const detailLinks = screen.getAllByRole("link", { name: "詳細" });
    expect(detailLinks[0]).toHaveAttribute(
      "href",
      "/teacher/school-classes/10",
    );
    expect(detailLinks[1]).toHaveAttribute(
      "href",
      "/teacher/school-classes/11",
    );
  });

  it("クラスが0件の学年は見出し行ごと表示されない", () => {
    render(<Presenter data={mockData} />);
    expect(screen.queryByText("高校2年")).not.toBeInTheDocument();
  });
});
