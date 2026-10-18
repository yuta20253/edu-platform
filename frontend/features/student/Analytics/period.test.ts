import { describe, expect, it } from "vitest";
import {
  detectPreset,
  periodFromSearchParams,
  periodToSearchParams,
  presetRange,
} from "./period";

const today = new Date(2026, 9, 18);

describe("presetRange", () => {
  it.each([
    [7, "2026-10-12"],
    [30, "2026-09-19"],
    [90, "2026-07-21"],
  ] as const)("%i日は今日を含む%i日間を返す", (days, from) => {
    expect(presetRange(days, today)).toEqual({ from, to: "2026-10-18" });
  });
});

describe("detectPreset", () => {
  it("期間が未指定のときはバックエンドの既定値と同じ7日とみなす", () => {
    expect(detectPreset({ from: "", to: "" }, today)).toBe(7);
  });

  it("プリセットと一致する期間ならその日数を返す", () => {
    expect(
      detectPreset({ from: "2026-09-19", to: "2026-10-18" }, today),
    ).toBe(30);
  });

  it("どのプリセットとも一致しない期間なら null を返す", () => {
    expect(
      detectPreset({ from: "2026-10-01", to: "2026-10-18" }, today),
    ).toBeNull();
  });

  it("日付がずれた過去のプリセット期間は一致とみなさない", () => {
    expect(
      detectPreset({ from: "2026-10-11", to: "2026-10-17" }, today),
    ).toBeNull();
  });
});

describe("periodFromSearchParams", () => {
  const parse = (query: string) =>
    periodFromSearchParams(new URLSearchParams(query));

  it("from・to が正しい日付ならそのまま取り込む", () => {
    expect(parse("from=2026-10-01&to=2026-10-18")).toEqual({
      from: "2026-10-01",
      to: "2026-10-18",
    });
  });

  it("未指定のときは空(デフォルト期間)にする", () => {
    expect(parse("")).toEqual({ from: "", to: "" });
  });

  it.each([
    ["形式が違う", "from=2026/10/01&to=2026-10-18"],
    ["実在しない日付", "from=2026-02-30&to=2026-10-18"],
    ["余計な文字を含む", "from=2026-10-01x&to=2026-10-18"],
    ["from だけ指定", "from=2026-10-01"],
    ["to だけ指定", "to=2026-10-18"],
  ])("%s ときは両方とも無視してデフォルト期間にする", (_, query) => {
    expect(parse(query)).toEqual({ from: "", to: "" });
  });

  it("from > to は形式が正しければ取り込む(期間の妥当性はバックエンドで判定する)", () => {
    expect(parse("from=2026-10-18&to=2026-10-01")).toEqual({
      from: "2026-10-18",
      to: "2026-10-01",
    });
  });
});

describe("periodToSearchParams", () => {
  it("from・to をクエリにする", () => {
    expect(
      periodToSearchParams({ from: "2026-10-12", to: "2026-10-18" }).toString(),
    ).toBe("from=2026-10-12&to=2026-10-18");
  });

  it("期間が空のときはクエリを付けない", () => {
    expect(periodToSearchParams({ from: "", to: "" }).toString()).toBe("");
  });
});
