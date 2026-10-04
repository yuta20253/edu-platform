import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import { useCreateStudentForm } from "./hooks/useCreateStudentForm";
import type { GradeOption } from "./types";

const mockGradeOptions: GradeOption[] = [
  {
    id: 1,
    year: 1,
    display_name: "1年",
    school_classes: [
      { id: 10, name: "A組" },
      { id: 11, name: "B組" },
    ],
  },
  {
    id: 2,
    year: 2,
    display_name: "2年",
    school_classes: [{ id: 20, name: "A組" }],
  },
];

type PresenterOverrides = Partial<React.ComponentProps<typeof Presenter>>;

const TestWrapper = (overrides: PresenterOverrides) => {
  const form = useCreateStudentForm();

  return (
    <Presenter
      form={form}
      gradeOptions={mockGradeOptions}
      onCreate={vi.fn()}
      creating={false}
      createErrors={[]}
      {...overrides}
    />
  );
};

describe("CreateStudent Presenter", () => {
  it("入力欄が表示される", () => {
    render(<TestWrapper />);
    expect(screen.getByRole("textbox", { name: "氏名" })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "氏名(カナ)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "メールアドレス" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "学年" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "学級" }),
    ).toBeInTheDocument();
  });

  it("学年未選択のときは学級選択が無効", () => {
    render(<TestWrapper />);
    expect(screen.getByRole("combobox", { name: "学級" })).toBeDisabled();
  });

  it("学年を選択するとその学年の学級だけが選択できる", () => {
    render(<TestWrapper />);

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "学年" }));
    fireEvent.click(screen.getByRole("option", { name: "1年" }));

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "学級" }));
    expect(screen.getByRole("option", { name: "A組" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "B組" })).toBeInTheDocument();
  });

  it("学年を変更すると学級の選択がリセットされる", () => {
    render(<TestWrapper />);

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "学年" }));
    fireEvent.click(screen.getByRole("option", { name: "1年" }));

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "学級" }));
    fireEvent.click(screen.getByRole("option", { name: "A組" }));

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "学年" }));
    fireEvent.click(screen.getByRole("option", { name: "2年" }));

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "学級" }));
    expect(screen.queryByRole("option", { name: "B組" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "A組" })).toBeInTheDocument();
  });

  it("必須項目が未入力のまま送信すると onCreate は呼ばれずエラーが表示される", async () => {
    const onCreate = vi.fn();
    render(<TestWrapper onCreate={onCreate} />);

    fireEvent.click(screen.getByRole("button", { name: "作成" }));

    await waitFor(() => {
      expect(screen.getByText("氏名を入力してください")).toBeInTheDocument();
    });
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("全項目を入力して送信すると onCreate が正しい値で呼ばれる", async () => {
    const onCreate = vi.fn();
    render(<TestWrapper onCreate={onCreate} />);

    fireEvent.change(screen.getByRole("textbox", { name: "氏名" }), {
      target: { value: "山田太郎" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "氏名(カナ)" }), {
      target: { value: "ヤマダタロウ" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "メールアドレス" }), {
      target: { value: "yamada@example.com" },
    });

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "学年" }));
    fireEvent.click(screen.getByRole("option", { name: "1年" }));

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "学級" }));
    fireEvent.click(screen.getByRole("option", { name: "A組" }));

    fireEvent.click(screen.getByRole("button", { name: "作成" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "山田太郎",
          name_kana: "ヤマダタロウ",
          email: "yamada@example.com",
          grade_id: 1,
          school_class_id: 10,
        }),
        expect.anything(),
      );
    });
  });

  it("createErrors が Alert で表示される", () => {
    render(
      <TestWrapper createErrors={["メールアドレスは既に使用されています"]} />,
    );
    expect(
      screen.getByText("メールアドレスは既に使用されています"),
    ).toBeInTheDocument();
  });

  it("creating 中は作成ボタンが無効", () => {
    render(<TestWrapper creating />);
    expect(screen.getByRole("button", { name: "作成" })).toBeDisabled();
  });
});
