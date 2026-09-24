import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UnderstandingScoreChart } from "./UnderstandingScoreChart";

describe("UnderstandingScoreChart", () => {
  it("教科・コース名を表示する", () => {
    render(
      <UnderstandingScoreChart
        data={{
          subjects: [
            {
              subject_name: "数学",
              courses: [
                {
                  level_name: "基礎",
                  level_number: 1,
                  units: [{ unit_name: "一次関数", score: 75 }],
                },
              ],
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("数学")).toBeInTheDocument();
    expect(screen.getByText("基礎レベル1")).toBeInTheDocument();
  });

  it("学習履歴がない場合は案内メッセージを表示する", () => {
    render(<UnderstandingScoreChart data={{ subjects: [] }} />);
    expect(screen.getByText("学習履歴がありません")).toBeInTheDocument();
  });

  it("同じlevel_numberでlevel_nameが異なるコースが両方表示される(keyの重複を防ぐ)", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <UnderstandingScoreChart
        data={{
          subjects: [
            {
              subject_name: "英語",
              courses: [
                {
                  level_name: "英文法",
                  level_number: 1,
                  units: [{ unit_name: "文型", score: 60 }],
                },
                {
                  level_name: "英読解",
                  level_number: 1,
                  units: [{ unit_name: "長文読解", score: 80 }],
                },
              ],
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("英文法レベル1")).toBeInTheDocument();
    expect(screen.getByText("英読解レベル1")).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("same key"),
      expect.anything(),
    );

    errorSpy.mockRestore();
  });

  it("同じlevel_nameでlevel_numberが異なるコースを区別して表示する", () => {
    render(
      <UnderstandingScoreChart
        data={{
          subjects: [
            {
              subject_name: "英語",
              courses: [
                {
                  level_name: "英文法",
                  level_number: 1,
                  units: [{ unit_name: "文型", score: 60 }],
                },
                {
                  level_name: "英文法",
                  level_number: 2,
                  units: [{ unit_name: "関係詞", score: 40 }],
                },
              ],
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("英文法レベル1")).toBeInTheDocument();
    expect(screen.getByText("英文法レベル2")).toBeInTheDocument();
  });
});
