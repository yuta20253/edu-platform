import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateGoal } from "./index";

const postMock = vi.fn().mockResolvedValue({ data: 1 });
vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: (...args: unknown[]) => postMock(...args) },
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@mui/x-date-pickers/DatePicker", () => ({
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
}));

describe("CreateGoal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("見出しと入力フィールドが表示される", () => {
    render(<CreateGoal />);
    expect(screen.getByText("目標設定")).toBeInTheDocument();
    expect(screen.getByText("目標名")).toBeInTheDocument();
    expect(screen.getByText("目標詳細")).toBeInTheDocument();
    expect(screen.getByText("期限")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "次へ" })).toBeInTheDocument();
  });

  it("未入力で送信すると目標名・期限のバリデーションエラーが表示される", async () => {
    render(<CreateGoal />);
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    expect(
      await screen.findByText("目標名を入力してください"),
    ).toBeInTheDocument();
    expect(screen.getByText("期限を選択してください")).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("目標名のみ入力して送信すると期限のエラーだけが残る", async () => {
    render(<CreateGoal />);
    const [titleInput] = screen.getAllByRole("textbox");
    fireEvent.change(titleInput, { target: { value: "英単語1000語を覚える" } });
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    expect(
      await screen.findByText("期限を選択してください"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("目標名を入力してください"),
    ).not.toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("全項目を入力して送信するとonSubmitが正しい値で呼ばれ遷移する", async () => {
    render(<CreateGoal />);
    const [titleInput, descriptionInput] = screen.getAllByRole("textbox");
    fireEvent.change(titleInput, { target: { value: "英単語1000語を覚える" } });
    fireEvent.change(descriptionInput, {
      target: { value: "毎日30分学習する" },
    });
    fireEvent.change(screen.getByLabelText("期限"), {
      target: { value: "2026-09-15" },
    });
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    expect(postMock).toHaveBeenCalledWith("/api/student/goals", {
      goal: {
        title: "英単語1000語を覚える",
        description: "毎日30分学習する",
        due_date: "2026-09-15",
      },
    });

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/goals/1/tasks/new"),
    );
  });
});
