import { describe, expect, it } from "vitest";
import { getDateLabel } from "./getDateLabel";
import { formatPublishedAt } from "@/libs/ui/formatDate";
import type { AuthoredAnnouncement } from "../types";

const base: AuthoredAnnouncement = {
  id: 1,
  title: "タイトル",
  content: "内容",
  status: "draft",
  published_at: null,
  scheduled_at: null,
};

describe("getDateLabel", () => {
  it("予約中のとき配信予定日時を表示する", () => {
    const scheduledAt = "2025-07-01T00:00:00.000Z";
    expect(
      getDateLabel({ ...base, status: "scheduled", scheduled_at: scheduledAt }),
    ).toBe(`配信予定: ${formatPublishedAt(scheduledAt)}`);
  });

  it("予約中でscheduled_atが無いとき「-」を表示する", () => {
    expect(
      getDateLabel({ ...base, status: "scheduled", scheduled_at: null }),
    ).toBe("配信予定: -");
  });

  it("公開済みのとき公開日時を表示する", () => {
    const publishedAt = "2025-06-01T00:00:00.000Z";
    expect(
      getDateLabel({ ...base, status: "published", published_at: publishedAt }),
    ).toBe(`公開: ${formatPublishedAt(publishedAt)}`);
  });

  it("下書きなど公開日時が無いとき「未公開」を表示する", () => {
    expect(getDateLabel({ ...base, status: "draft" })).toBe("未公開");
  });
});
