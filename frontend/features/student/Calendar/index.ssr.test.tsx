import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "./index";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(() => new Promise(() => {})) },
}));

// サーバー(例: UTC)とブラウザ(JST)で「今日」がずれてもハイドレーションエラーにならないよう、
// サーバー描画の結果が現在日時に依存しないことを確認する
describe("Calendar のサーバー描画", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 6, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("日付を含まず読み込み中の表示だけを描画する", () => {
    const html = renderToString(<Calendar />);

    expect(html).toContain('role="progressbar"');
    expect(html).not.toContain("2026年10月");
    expect(html).not.toContain("の予定");
  });
});
