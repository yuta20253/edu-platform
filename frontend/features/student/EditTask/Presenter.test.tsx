import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useForm } from "react-hook-form";
import { Presenter } from "./Presenter";
import type { EditTaskForm, Task } from "./types";
import type { Course } from "@/types/tasks/course";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockTask: Task = {
  id: 1,
  goal_id: 10,
  title: "英単語100個を覚える",
  content: "単語帳1〜100",
  due_date: "2026-09-01",
  priority: "high",
  status: "not_started",
  completed_at: "",
  units: [
    { id: 11, course_id: 1, unit_name: "be動詞", started: false },
    { id: 12, course_id: 1, unit_name: "一般動詞", started: true },
  ],
};

const mockCourse: Course = {
  id: 1,
  level_number: 1,
  level_name: "標準",
  description: "基礎講座",
  units: [
    { id: 11, course_id: 1, unit_name: "be動詞" },
    { id: 12, course_id: 1, unit_name: "一般動詞" },
  ],
};

type WrapperProps = {
  task?: Task;
  goalId?: number;
  courses?: Course[] | null;
  selectedCourseId?: number | null;
  showAllCourses?: boolean;
  fetchCourse?: (name: string) => Promise<void>;
  selectedCourse?: Course | null;
  displayedCourses?: Course[] | null;
  setSelectedCourseId?: (value: number) => void;
  setShowAllCourses?: () => void;
  selectedUnitIds?: number[];
  handleToggleUnit?: (unitId: number) => void;
  onSubmit?: (data: EditTaskForm) => void;
  toast?: { open: boolean; message: string; severity: "success" | "error" };
  closeToast?: () => void;
};

const Wrapper = ({
  task = mockTask,
  goalId,
  courses = null,
  selectedCourseId = null,
  showAllCourses = false,
  fetchCourse = vi.fn(),
  selectedCourse = null,
  displayedCourses = null,
  setSelectedCourseId = vi.fn(),
  setShowAllCourses = vi.fn(),
  selectedUnitIds = [],
  handleToggleUnit = vi.fn(),
  onSubmit = vi.fn(),
  toast = { open: false, message: "", severity: "success" as const },
  closeToast = vi.fn(),
}: WrapperProps) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditTaskForm>();

  return (
    <Presenter
      goalId={goalId}
      task={task}
      courses={courses}
      selectedCourseId={selectedCourseId}
      showAllCourses={showAllCourses}
      fetchCourse={fetchCourse}
      selectedCourse={selectedCourse}
      displayedCourses={displayedCourses}
      setSelectedCourseId={setSelectedCourseId}
      setShowAllCourses={setShowAllCourses}
      selectedUnitIds={selectedUnitIds}
      handleToggleUnit={handleToggleUnit}
      register={register}
      control={control}
      errors={errors}
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      toast={toast}
      closeToast={closeToast}
    />
  );
};

describe("EditTaskPresenter", () => {
  it("見出し・タスクの初期値がフォームに表示される", () => {
    render(<Wrapper />);
    expect(screen.getByText("タスク更新")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")[0]).toHaveValue(
      "英単語100個を覚える",
    );
    expect(screen.getAllByRole("textbox")[1]).toHaveValue("単語帳1〜100");
  });

  it("goalIdがないとき戻るリンクが /tasks/[id] を指す", () => {
    render(<Wrapper />);
    expect(
      screen.getByRole("link", { name: /タスク詳細に戻る/ }),
    ).toHaveAttribute("href", "/tasks/1");
  });

  it("goalIdがあるとき戻るリンクが /goals/[goalId]/tasks/[id] を指す", () => {
    render(<Wrapper goalId={99} />);
    expect(
      screen.getByRole("link", { name: /タスク詳細に戻る/ }),
    ).toHaveAttribute("href", "/goals/99/tasks/1");
  });

  it("タイトルを空にして送信すると「タスク名を入力してください」が表示される", async () => {
    const onSubmit = vi.fn();
    render(<Wrapper onSubmit={onSubmit} />);

    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(
        screen.getByText("タスク名を入力してください"),
      ).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("フォームを変更せず送信すると onSubmit がタスクの初期値で呼ばれる", async () => {
    const onSubmit = vi.fn();
    render(<Wrapper onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "英単語100個を覚える",
          content: "単語帳1〜100",
          priority: "high",
        }),
        expect.anything(),
      );
    });
  });

  it("教科を選択すると fetchCourse が呼ばれる", () => {
    const fetchCourse = vi.fn();
    render(<Wrapper fetchCourse={fetchCourse} />);

    fireEvent.mouseDown(screen.getAllByRole("combobox")[1]);
    fireEvent.click(screen.getByRole("option", { name: "英語" }));

    expect(fetchCourse).toHaveBeenCalledWith("英語");
  });

  it("講座一覧の「詳細を見る」で setSelectedCourseId が呼ばれる", () => {
    const setSelectedCourseId = vi.fn();
    render(
      <Wrapper
        courses={[mockCourse]}
        displayedCourses={[mockCourse]}
        setSelectedCourseId={setSelectedCourseId}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "詳細を見る" }));
    expect(setSelectedCourseId).toHaveBeenCalledWith(1);
  });

  it("選択中講座の単元一覧が表示され、学習開始済みの単元はチェックボックスが無効で表示名にサフィックスが付く", () => {
    render(
      <Wrapper
        selectedCourseId={1}
        selectedCourse={mockCourse}
        task={mockTask}
      />,
    );

    expect(screen.getByText("単元一覧")).toBeInTheDocument();
    expect(screen.getByLabelText("be動詞")).not.toBeDisabled();
    expect(screen.getByLabelText("一般動詞（学習開始済み）")).toBeDisabled();
  });

  it("未着手の単元チェックボックスをクリックすると handleToggleUnit が呼ばれる", () => {
    const handleToggleUnit = vi.fn();
    render(
      <Wrapper
        selectedCourseId={1}
        selectedCourse={mockCourse}
        handleToggleUnit={handleToggleUnit}
      />,
    );

    fireEvent.click(screen.getByLabelText("be動詞"));
    expect(handleToggleUnit).toHaveBeenCalledWith(11);
  });

  it("toast.open のときメッセージが表示される", () => {
    render(
      <Wrapper
        toast={{
          open: true,
          message: "タスクを更新しました",
          severity: "success",
        }}
      />,
    );
    expect(screen.getByText("タスクを更新しました")).toBeInTheDocument();
  });
});
