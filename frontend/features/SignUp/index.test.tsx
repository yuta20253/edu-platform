import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignUp } from "./index";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("./hooks/hooks", () => ({
  useSubmit: vi.fn(() => ({ onSubmit: vi.fn() })),
}));

vi.mock("./hooks/useFetchSchools", () => ({
  useFetchSchools: vi.fn(() => ({
    highSchools: [],
    setHighSchools: vi.fn(),
    fetchSchools: vi.fn(),
  })),
}));

vi.mock("./hooks/useFetchGrades", () => ({
  useFetchGrades: vi.fn(() => ({
    grades: [],
    setGrades: vi.fn(),
    fetchGrades: vi.fn(),
  })),
}));

vi.mock("./hooks/useFetchPrefectures", () => ({
  useFetchPrefectures: vi.fn(() => ({ prefectures: [] })),
}));

describe("SignUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("学校名検索の注釈テキストはエラーに見えない注釈色(text.secondary)で表示される", () => {
    render(<SignUp userRole="student" />);

    const hint = screen.getByText(
      "都道府県を選択後、学校名を2文字以上入力すると候補が表示されます",
    );

    expect(getComputedStyle(hint).color).toBe("rgba(0, 0, 0, 0.6)");
  });
});
