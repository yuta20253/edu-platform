import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminSidebar } from "./AdminSidebar";
import { MeUser } from "@/types/common/me";

const mockPush = vi.hoisted(() => vi.fn());
const mockPathname = vi.hoisted(() => vi.fn(() => "/admin/dashboard"));
const mockPost = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: mockPost },
}));

const mockUser: MeUser = {
  id: 1,
  email: "admin@example.com",
  name: "管理者太郎",
  user_role: { name: "admin" },
  high_school: { name: "テスト高校" },
  name_kana: "",
  profile_completed: false,
  user_personal_info: {
    id: 0,
    phone_number: "",
    birthday: "",
    gender: ""
  },
  grade: {
    year: 0,
    display_name: ""
  },
  address: {
    postal_code: "",
    city: "",
    town: "",
    prefecture: {
      id: 0,
      name: ""
    }
  }
};

describe("AdminSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/admin/dashboard");
  });

  it("ナビゲーション項目が7件表示される", () => {
    render(<AdminSidebar user={mockUser} />);
    expect(screen.getByText("ダッシュボード")).toBeInTheDocument();
    expect(screen.getByText("管理者")).toBeInTheDocument();
    expect(screen.getByText("高校管理")).toBeInTheDocument();
    expect(screen.getByText("講座管理")).toBeInTheDocument();
    expect(screen.getByText("CSVインポート")).toBeInTheDocument();
    expect(screen.getByText("お知らせ")).toBeInTheDocument();
    expect(screen.getByText("分析・レポート")).toBeInTheDocument();
  });

  it("ユーザー名が表示される", () => {
    render(<AdminSidebar user={mockUser} />);
    expect(screen.getByText("管理者太郎")).toBeInTheDocument();
  });

  it('現在のパスに一致する項目が aria-current="page" を持つ', () => {
    mockPathname.mockReturnValue("/admin/dashboard");
    render(<AdminSidebar user={mockUser} />);
    const activeLink = screen.getByText("ダッシュボード").closest("a");
    expect(activeLink).toHaveAttribute("aria-current", "page");
  });

  it("ログアウトボタンのクリックで apiClient.post が呼ばれる", async () => {
    render(<AdminSidebar user={mockUser} />);
    fireEvent.click(screen.getByText("ログアウト"));
    expect(mockPost).toHaveBeenCalledWith("/api/auth/logout");
  });
});
