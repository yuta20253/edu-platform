import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { RankType } from "./types";

const baseProps = {
  type: "course_rank" as RankType,
  setType: vi.fn(),
  subject: null,
  setSubject: vi.fn(),
  courseId: null,
  setCourseId: vi.fn(),
  unitId: null,
  setUnitId: vi.fn(),
  courses: null,
  units: [],
};

describe("AnalyticsPresenter", () => {
  it("見出し「学習分析」が表示される", () => {
    render(<Presenter {...baseProps}>{null}</Presenter>);
    expect(screen.getByText("学習分析")).toBeInTheDocument();
  });

  it("childrenがそのまま表示される", () => {
    render(
      <Presenter {...baseProps}>
        <div>コンテンツ</div>
      </Presenter>,
    );
    expect(screen.getByText("コンテンツ")).toBeInTheDocument();
  });
});
