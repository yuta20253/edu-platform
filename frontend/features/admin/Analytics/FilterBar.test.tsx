import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilterBar } from "./FilterBar";
import type { AnalyticsFilters } from "./types";

const emptyFilters: AnalyticsFilters = {
  from: "",
  to: "",
  highSchoolId: "",
  subjectId: "",
};

const defaultProps = {
  filters: emptyFilters,
  highSchoolOptions: [
    { id: 1, name: "A高校" },
    { id: 2, name: "B高校" },
  ],
  subjectOptions: [
    { id: 1, name: "英語" },
    { id: 2, name: "数学" },
  ],
  validationErrors: [] as string[],
  onChange: vi.fn(),
};

describe("FilterBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("期間プリセット", () => {
    beforeEach(() => {
      // 2026-09-30 に固定する（プリセットの期間算出が今日基準のため）
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 8, 30));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("過去7日 / 30日 / 90日のチップが表示される", () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByRole("button", { name: "過去7日" })).toBeVisible();
      expect(screen.getByRole("button", { name: "過去30日" })).toBeVisible();
      expect(screen.getByRole("button", { name: "過去90日" })).toBeVisible();
    });

    it("期間未指定のときは既定の過去30日が選択状態になる", () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByRole("button", { name: "過去30日" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByRole("button", { name: "過去7日" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    it("プリセットと一致する期間のチップが選択状態になる", () => {
      render(
        <FilterBar
          {...defaultProps}
          filters={{ ...emptyFilters, from: "2026-09-24", to: "2026-09-30" }}
        />,
      );
      expect(screen.getByRole("button", { name: "過去7日" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    it("カスタム範囲のときはどのチップも選択状態にならない", () => {
      render(
        <FilterBar
          {...defaultProps}
          filters={{ ...emptyFilters, from: "2026-09-01", to: "2026-09-10" }}
        />,
      );
      for (const name of ["過去7日", "過去30日", "過去90日"]) {
        expect(screen.getByRole("button", { name })).toHaveAttribute(
          "aria-pressed",
          "false",
        );
      }
    });

    it("チップのクリックで当日を含む期間が onChange に渡される", () => {
      const onChange = vi.fn();
      render(<FilterBar {...defaultProps} onChange={onChange} />);
      fireEvent.click(screen.getByRole("button", { name: "過去7日" }));
      expect(onChange).toHaveBeenCalledWith({
        from: "2026-09-24",
        to: "2026-09-30",
      });
    });
  });

  describe("カスタム期間", () => {
    it("開始日・終了日の入力欄が表示される", () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.getByRole("group", { name: /開始日/ })).toBeVisible();
      expect(screen.getByRole("group", { name: /終了日/ })).toBeVisible();
    });

    it("開始日欄に日付を入力すると、確定した日付だけが onChange に渡される", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<FilterBar {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByRole("group", { name: /開始日/ }));
      for (const digit of "20260901") {
        await user.keyboard(digit);
      }

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({ from: "2026-09-01" });
    });

    it("既に日付が入っている欄で年を打ち直す途中の不完全な年(0020年など)は onChange に渡さない", async () => {
      // 年を「2026」と打つ途中で「0020」「0202」のような妥当な Date が一瞬できる。
      // これをそのままフィルタに反映すると、366日超の期間として 422 が一瞬表示される。
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <FilterBar
          {...defaultProps}
          filters={{ ...emptyFilters, from: "2026-10-02", to: "2026-10-08" }}
          onChange={onChange}
        />,
      );

      await user.click(screen.getByRole("group", { name: /開始日/ }));
      await user.keyboard("2026");

      const years = onChange.mock.calls.map(([patch]) =>
        Number(String(patch.from).slice(0, 4)),
      );
      expect(years.every((year) => year >= 1000)).toBe(true);
    });

    it("終了日が開始日より前のとき、エラーメッセージが表示される", () => {
      render(
        <FilterBar
          {...defaultProps}
          filters={{ ...emptyFilters, from: "2026-09-20", to: "2026-09-01" }}
        />,
      );
      expect(
        screen.getByText("終了日は開始日以降の日付を指定してください"),
      ).toBeInTheDocument();
    });
  });

  describe("高校・科目セレクト", () => {
    it("高校セレクトに「すべて」と各高校が表示される", () => {
      render(<FilterBar {...defaultProps} />);
      fireEvent.mouseDown(screen.getByLabelText("高校"));
      expect(screen.getByRole("option", { name: "すべて" })).toBeVisible();
      expect(screen.getByRole("option", { name: "A高校" })).toBeVisible();
      expect(screen.getByRole("option", { name: "B高校" })).toBeVisible();
    });

    it("高校を選ぶと highSchoolId が onChange に渡される", () => {
      const onChange = vi.fn();
      render(<FilterBar {...defaultProps} onChange={onChange} />);
      fireEvent.mouseDown(screen.getByLabelText("高校"));
      fireEvent.click(screen.getByRole("option", { name: "B高校" }));
      expect(onChange).toHaveBeenCalledWith({ highSchoolId: "2" });
    });

    it("高校の「すべて」を選ぶと highSchoolId が空文字で渡される", () => {
      const onChange = vi.fn();
      render(
        <FilterBar
          {...defaultProps}
          filters={{ ...emptyFilters, highSchoolId: "2" }}
          onChange={onChange}
        />,
      );
      fireEvent.mouseDown(screen.getByLabelText("高校"));
      fireEvent.click(screen.getByRole("option", { name: "すべて" }));
      expect(onChange).toHaveBeenCalledWith({ highSchoolId: "" });
    });

    it("科目を選ぶと subjectId が onChange に渡される", () => {
      const onChange = vi.fn();
      render(<FilterBar {...defaultProps} onChange={onChange} />);
      fireEvent.mouseDown(screen.getByLabelText("科目"));
      fireEvent.click(screen.getByRole("option", { name: "数学" }));
      expect(onChange).toHaveBeenCalledWith({ subjectId: "2" });
    });

    it("選択中の高校名が表示される", () => {
      render(
        <FilterBar
          {...defaultProps}
          filters={{ ...emptyFilters, highSchoolId: "1" }}
        />,
      );
      expect(screen.getByLabelText("高校")).toHaveTextContent("A高校");
    });
  });

  describe("検証エラー(422)", () => {
    it("エラーメッセージをすべて表示する", () => {
      render(
        <FilterBar
          {...defaultProps}
          validationErrors={["指定できる期間は366日以内です", "別のエラー"]}
        />,
      );
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("指定できる期間は366日以内です");
      expect(alert).toHaveTextContent("別のエラー");
    });

    it("同じ文言が複数あっても重複keyの警告を出さずすべて表示する", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      render(
        <FilterBar {...defaultProps} validationErrors={["同じ", "同じ"]} />,
      );
      expect(screen.getAllByText("同じ")).toHaveLength(2);
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it("エラーが無いときはアラートを表示しない", () => {
      render(<FilterBar {...defaultProps} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
