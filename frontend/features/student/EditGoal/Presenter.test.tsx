import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useForm } from "react-hook-form";
import { Presenter } from "./Presenter";
import { EditGoalForm, Goal } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@mui/x-date-pickers", () => ({
  DatePicker: ({
    value,
    onChange,
    slotProps,
  }: {
    value: Date | null;
    onChange: (date: Date | null) => void;
    slotProps?: { textField?: { helperText?: string } };
  }) => (
    <div>
      <input
        aria-label="期限"
        type="text"
        value={value ? value.toISOString().split("T")[0] : ""}
        onChange={(e) =>
          onChange(e.target.value ? new Date(e.target.value) : null)
        }
      />
      {slotProps?.textField?.helperText && (
        <span>{slotProps.textField.helperText}</span>
      )}
    </div>
  ),
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const mockGoal: Goal = {
  id: 1,
  title: "英単語1000語を覚える",
  description: "毎日30分学習する",
  status: "in_progress",
  due_date: "2026-09-30",
  tasks: [
    {
      id: 10,
      goal_id: 1,
      title: "単語帳を1周する",
      content: "",
      status: "completed",
      priority: 1,
      due_date: "2026-09-10",
      unit_ids: null,
    },
  ],
};

type WrapperProps = {
  goal?: Goal;
  onSubmit?: (data: EditGoalForm) => void;
  errors?: Record<string, { message?: string }>;
  toast?: { open: boolean; message: string; severity: "success" | "error" };
  closeToast?: () => void;
};

const Wrapper = ({
  goal = mockGoal,
  onSubmit = vi.fn(),
  errors = {},
  toast = { open: false, message: "", severity: "success" as const },
  closeToast = vi.fn(),
}: WrapperProps) => {
  const { control, register, handleSubmit } = useForm<EditGoalForm>({
    defaultValues: {
      title: goal.title,
      description: goal.description,
      due_date: goal.due_date ? new Date(goal.due_date) : null,
    },
  });

  return (
    <Presenter
      goal={goal}
      register={register}
      control={control}
      errors={errors as never}
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      toast={toast}
      closeToast={closeToast}
    />
  );
};

describe("EditGoalPresenter", () => {
  it("見出しと目標の初期値が入力欄に表示される", () => {
    render(<Wrapper />);
    expect(screen.getByText("目標編集")).toBeInTheDocument();
    expect(screen.getAllByText("英単語1000語を覚える").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByDisplayValue("毎日30分学習する")).toBeInTheDocument();
    expect(screen.getByLabelText("期限")).toHaveValue("2026-09-30");
  });

  it("紐づくタスクが行として正しくレンダリングされる", () => {
    render(<Wrapper />);
    expect(screen.getByText("単語帳を1周する")).toBeInTheDocument();
    expect(screen.getByText("期限: 2026-09-10")).toBeInTheDocument();
    expect(screen.getByText("完了")).toBeInTheDocument();
  });

  it("タスクが空のとき「タスクはまだありません」が表示される", () => {
    render(<Wrapper goal={{ ...mockGoal, tasks: [] }} />);
    expect(screen.getByText("タスクはまだありません")).toBeInTheDocument();
  });

  it("「目標詳細へ戻る」リンクが /goals/[id] を指している", () => {
    render(<Wrapper />);
    expect(screen.getByText("目標詳細へ戻る").closest("a")).toHaveAttribute(
      "href",
      "/goals/1",
    );
  });

  it("「タスク追加」リンクが /goals/[id]/tasks/new を指している", () => {
    render(<Wrapper />);
    expect(screen.getByRole("link", { name: "タスク追加" })).toHaveAttribute(
      "href",
      "/goals/1/tasks/new",
    );
  });

  it("各タスクのリンクが /goals/[id]/tasks/[taskId] を指している", () => {
    render(<Wrapper />);
    expect(screen.getByText("単語帳を1周する").closest("a")).toHaveAttribute(
      "href",
      "/goals/1/tasks/10",
    );
  });

  it("編集して保存すると onSubmit が編集値で呼ばれる", async () => {
    const onSubmit = vi.fn();
    render(<Wrapper onSubmit={onSubmit} />);

    fireEvent.change(screen.getByDisplayValue("英単語1000語を覚える"), {
      target: { value: "英単語2000語を覚える" },
    });
    fireEvent.change(screen.getByLabelText("期限"), {
      target: { value: "2026-10-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "英単語2000語を覚える",
          description: "毎日30分学習する",
          due_date: new Date("2026-10-01"),
        }),
        expect.anything(),
      );
    });
  });

  it("エラーメッセージが helperText として表示される", () => {
    render(
      <Wrapper errors={{ title: { message: "目標名を入力してください" } }} />,
    );
    expect(screen.getByText("目標名を入力してください")).toBeInTheDocument();
  });

  it("toast.open のときメッセージが表示される", () => {
    render(
      <Wrapper
        toast={{
          open: true,
          message: "目標を更新しました",
          severity: "success",
        }}
      />,
    );
    expect(screen.getByText("目標を更新しました")).toBeInTheDocument();
  });
});
