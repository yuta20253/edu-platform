import { describe, expect, it } from "vitest";
import {
  detectPreset,
  filtersFromSearchParams,
  filtersToSearchParams,
  presetRange,
} from "./filters";
import type { AnalyticsFilters } from "./types";

// 2026-09-30 (JST)。月をまたぐ計算を確認するため月末を使う
const today = new Date(2026, 8, 30);

describe("presetRange", () => {
  it("過去7日は当日を含む7日間(9/24〜9/30)になる", () => {
    expect(presetRange(7, today)).toEqual({
      from: "2026-09-24",
      to: "2026-09-30",
    });
  });

  it("過去30日は月をまたいでも当日を含む30日間になる", () => {
    expect(presetRange(30, today)).toEqual({
      from: "2026-09-01",
      to: "2026-09-30",
    });
  });

  it("過去90日は年またぎでも正しく算出する", () => {
    expect(presetRange(90, new Date(2026, 0, 31))).toEqual({
      from: "2025-11-03",
      to: "2026-01-31",
    });
  });
});

describe("detectPreset", () => {
  it("プリセットと一致する期間ならその日数を返す", () => {
    expect(detectPreset({ from: "2026-09-24", to: "2026-09-30" }, today)).toBe(
      7,
    );
  });

  it("どのプリセットとも一致しない場合は null を返す", () => {
    expect(detectPreset({ from: "2026-09-01", to: "2026-09-10" }, today)).toBe(
      null,
    );
  });

  it("期間が未指定のときは既定の30日として扱う", () => {
    expect(detectPreset({ from: "", to: "" }, today)).toBe(30);
  });
});

describe("filtersFromSearchParams", () => {
  it("クエリからフィルタ値を取り出す", () => {
    const params = new URLSearchParams(
      "from=2026-09-01&to=2026-09-30&high_school_id=4&subject_id=2",
    );
    expect(filtersFromSearchParams(params)).toEqual({
      from: "2026-09-01",
      to: "2026-09-30",
      highSchoolId: "4",
      subjectId: "2",
    });
  });

  it("クエリが無いときはすべて空文字になる", () => {
    expect(filtersFromSearchParams(new URLSearchParams(""))).toEqual({
      from: "",
      to: "",
      highSchoolId: "",
      subjectId: "",
    });
  });

  it("YYYY-MM-DD 形式でない日付は空文字として無視する", () => {
    const params = new URLSearchParams("from=abc&to=2026-13-45");
    const filters = filtersFromSearchParams(params);
    expect(filters.from).toBe("");
    expect(filters.to).toBe("");
  });

  it("数値でないIDは空文字として無視する", () => {
    const params = new URLSearchParams("high_school_id=abc&subject_id=1;DROP");
    const filters = filtersFromSearchParams(params);
    expect(filters.highSchoolId).toBe("");
    expect(filters.subjectId).toBe("");
  });
});

describe("filtersToSearchParams", () => {
  it("値のあるフィルタだけをAPIのキー名でクエリにする", () => {
    const filters: AnalyticsFilters = {
      from: "2026-09-01",
      to: "2026-09-30",
      highSchoolId: "",
      subjectId: "2",
    };
    expect(filtersToSearchParams(filters).toString()).toBe(
      "from=2026-09-01&to=2026-09-30&subject_id=2",
    );
  });

  it("すべて空のときは空クエリになる", () => {
    expect(
      filtersToSearchParams({
        from: "",
        to: "",
        highSchoolId: "",
        subjectId: "",
      }).toString(),
    ).toBe("");
  });
});
