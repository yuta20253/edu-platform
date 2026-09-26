import { describe, expect, it } from "vitest";
import { announcementStatusDefinitions } from "./announcement_status";

describe("announcementStatusDefinitions", () => {
  it("StatusBadge用にlabel/colorを1つのテーブルにまとめて返す", () => {
    expect(announcementStatusDefinitions.draft).toEqual({
      label: "下書き",
      color: "default",
    });
    expect(announcementStatusDefinitions.scheduled).toEqual({
      label: "予約配信",
      color: "info",
    });
    expect(announcementStatusDefinitions.published).toEqual({
      label: "配信済み",
      color: "success",
    });
  });
});
