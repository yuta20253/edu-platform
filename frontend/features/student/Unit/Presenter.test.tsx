import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Presenter } from "./Presenter";
import type { UnitType } from "./types";

const pushMock = vi.fn();
const backMock = vi.fn();
const routerMock = { push: pushMock, back: backMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

const mockUnit: UnitType = {
  id: 11,
  course_id: 1,
  unit_name: "二次関数",
  course: {
    id: 1,
    level_number: 1,
    level_name: "標準",
  },
};

const defaultProps = {
  goalId: undefined as number | undefined,
  taskId: 5,
  unitId: 11,
  unit: mockUnit,
};

describe("UnitPresenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("講座レベル・単元名が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("標準レベル1")).toBeInTheDocument();
    expect(screen.getByText("単元: 二次関数")).toBeInTheDocument();
  });

  it("「スタート」ボタンでgoalIdなしのquestions画面へ遷移する", () => {
    render(<Presenter {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "スタート" }));
    expect(pushMock).toHaveBeenCalledWith("/tasks/5/units/11/questions");
  });

  it("goalIdがあるとき「スタート」ボタンでgoals配下のquestions画面へ遷移する", () => {
    render(<Presenter {...defaultProps} goalId={3} />);
    fireEvent.click(screen.getByRole("button", { name: "スタート" }));
    expect(pushMock).toHaveBeenCalledWith(
      "/goals/3/tasks/5/units/11/questions",
    );
  });

  it("「戻る」ボタンでrouter.backが呼ばれる", () => {
    render(<Presenter {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(backMock).toHaveBeenCalledTimes(1);
  });
});
