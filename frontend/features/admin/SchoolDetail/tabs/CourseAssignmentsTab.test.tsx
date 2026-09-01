import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { CourseAssignmentsTab } from "./CourseAssignmentsTab";

const routerMock = { push: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const assignment = {
  id: 1,
  assigned_at: "2026-01-01T00:00:00.000Z",
  course: {
    id: 10,
    level_number: 1,
    level_name: "基礎",
    subject: { id: 2, name: "数学" },
  },
};

const courseOptionsResponse = {
  data: {
    courses: [
      {
        id: 10,
        level_number: 1,
        level_name: "基礎",
        subject: { id: 2, name: "数学" },
      },
      {
        id: 20,
        level_number: 2,
        level_name: "応用",
        subject: { id: 3, name: "英語" },
      },
    ],
    meta: { current_page: 1, total_pages: 1, total_count: 2, per_page: 100 },
  },
};

describe("CourseAssignmentsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("割当済みコースが0件のとき空状態メッセージが表示される", async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/course_assignments"))
        return Promise.resolve({ data: { course_assignments: [] } });
      return Promise.resolve(courseOptionsResponse);
    });

    render(<CourseAssignmentsTab schoolId={1} />);

    expect(
      await screen.findByText("コースが割り当てられていません"),
    ).toBeInTheDocument();
  });

  it("割当済みコース一覧が表示される", async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/course_assignments"))
        return Promise.resolve({ data: { course_assignments: [assignment] } });
      return Promise.resolve(courseOptionsResponse);
    });

    render(<CourseAssignmentsTab schoolId={1} />);

    expect(await screen.findByText("数学 基礎")).toBeInTheDocument();
  });

  it("コースを選んで割り当てるとAPIが呼ばれる", async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/course_assignments"))
        return Promise.resolve({ data: { course_assignments: [] } });
      return Promise.resolve(courseOptionsResponse);
    });
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { course_assignment: assignment },
    });

    render(<CourseAssignmentsTab schoolId={1} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "コースを割り当てる" }),
    );
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "数学 基礎" }));
    fireEvent.click(screen.getByRole("button", { name: "割り当てる" }));

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/admin/schools/1/course_assignments",
        { course_id: 10 },
      ),
    );
  });

  it("割当に失敗した場合は選択UIを閉じずエラーを表示する", async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/course_assignments"))
        return Promise.resolve({ data: { course_assignments: [] } });
      return Promise.resolve(courseOptionsResponse);
    });
    vi.mocked(apiClient.post).mockRejectedValue({
      response: { status: 422, data: { errors: ["既に割り当てられています"] } },
    });

    render(<CourseAssignmentsTab schoolId={1} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "コースを割り当てる" }),
    );
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "数学 基礎" }));
    fireEvent.click(screen.getByRole("button", { name: "割り当てる" }));

    expect(
      await screen.findByText("既に割り当てられています"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "割り当てる" }),
    ).toBeInTheDocument();
  });

  it("解除ボタンでAPIが呼ばれる", async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/course_assignments"))
        return Promise.resolve({ data: { course_assignments: [assignment] } });
      return Promise.resolve(courseOptionsResponse);
    });
    vi.mocked(apiClient.delete).mockResolvedValue({});

    render(<CourseAssignmentsTab schoolId={1} />);

    fireEvent.click(await screen.findByRole("button", { name: "解除" }));

    await waitFor(() =>
      expect(apiClient.delete).toHaveBeenCalledWith(
        "/api/admin/schools/1/course_assignments/10",
      ),
    );
  });
});
