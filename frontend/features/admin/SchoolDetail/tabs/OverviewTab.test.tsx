import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OverviewTab } from "./OverviewTab";
import type { SchoolDetail } from "../types";

const school: SchoolDetail = {
  id: 1,
  name: "東京第一高校",
  prefecture_name: "東京都",
  student_count: 300,
  teacher_count: 20,
};

describe("OverviewTab", () => {
  it("生徒数・教師数・都道府県が表示される", () => {
    render(<OverviewTab school={school} />);
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("東京都")).toBeInTheDocument();
  });
});
