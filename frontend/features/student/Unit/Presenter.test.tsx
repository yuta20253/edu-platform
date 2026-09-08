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
  onStart: vi.fn(),
  isStarting: false,
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

  it("「スタート」ボタンをクリックするとonStartが呼ばれる", () => {
    const onStart = vi.fn();
    render(<Presenter {...defaultProps} onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: "スタート" }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("isStarting中は「スタート」ボタンが無効になる", () => {
    render(<Presenter {...defaultProps} isStarting />);
    expect(screen.getByRole("button", { name: "スタート" })).toBeDisabled();
  });

  it("「戻る」ボタンでrouter.backが呼ばれる", () => {
    render(<Presenter {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(backMock).toHaveBeenCalledTimes(1);
  });
});
