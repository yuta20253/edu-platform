import { describe, expect, it } from "vitest";
import { buildCourseLabel } from "./courseLabel";

describe("buildCourseLabel", () => {
  it("レベル名とレベル番号を結合したラベルを返す", () => {
    expect(buildCourseLabel({ level_name: "標準", level_number: 2 })).toBe(
      "標準レベル2",
    );
  });
});
