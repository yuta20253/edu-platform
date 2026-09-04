import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchHistoryDetail } from "./useFetchHistoryDetail";
import type { ImportHistoryDetailData } from "../types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const mockDetail: ImportHistoryDetailData = {
  id: 1,
  course: { id: 10, level_name: "基礎英語" },
  unit: { id: 100, unit_name: "単元1" },
  user: { id: 1000, name: "実行太郎" },
  file_name: "questions.csv",
  status: "completed",
  mode: "append",
  total_count: 10,
  success_count: 8,
  error_count: 2,
  started_at: "2026-08-01T10:00:00Z",
  finished_at: "2026-08-01T10:05:00Z",
  created_at: "2026-08-01T10:00:00Z",
  errors: [{ row_number: 3, message: "問題文は必須です" }],
  warnings: [],
};

describe("useFetchHistoryDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("インポート履歴詳細を取得しdataにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockDetail });

    const { result } = renderHook(() => useFetchHistoryDetail(1));

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data).toEqual(mockDetail);
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/admin/import_histories/1",
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it("初期表示ではエラータブが選択されている", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockDetail });

    const { result } = renderHook(() => useFetchHistoryDetail(1));

    expect(result.current.activeTab).toBe("errors");
  });

  it("onTabChange でタブを切り替えられる", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockDetail });

    const { result } = renderHook(() => useFetchHistoryDetail(1));

    act(() => {
      result.current.onTabChange("warnings");
    });

    expect(result.current.activeTab).toBe("warnings");
  });

  it("取得に失敗した場合は error が true になる", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 404 } });

    const { result } = renderHook(() => useFetchHistoryDetail(999));

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });

    renderHook(() => useFetchHistoryDetail(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  describe("onExport", () => {
    let clickMock: ReturnType<typeof vi.fn>;
    let createObjectURLMock: ReturnType<typeof vi.fn>;
    let revokeObjectURLMock: ReturnType<typeof vi.fn>;
    let originalCreateElement: typeof document.createElement;

    beforeEach(() => {
      clickMock = vi.fn();
      createObjectURLMock = vi.fn(() => "blob:mock-url");
      revokeObjectURLMock = vi.fn();
      global.URL.createObjectURL =
        createObjectURLMock as unknown as typeof URL.createObjectURL;
      global.URL.revokeObjectURL =
        revokeObjectURLMock as unknown as typeof URL.revokeObjectURL;

      // a要素だけ click を差し替え、他の要素は本来の生成処理に任せる
      originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tagName) => {
        const element = originalCreateElement(tagName);
        if (tagName === "a") {
          element.click = clickMock;
        }
        return element;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("CSVを取得してダウンロードを実行する", async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockDetail })
        .mockResolvedValueOnce({
          data: new Blob(["csv"]),
          headers: {},
        });

      const { result } = renderHook(() => useFetchHistoryDetail(1));
      await waitFor(() => expect(result.current.data).not.toBeNull());

      await act(async () => {
        await result.current.onExport();
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/admin/import_histories/1/export",
        { responseType: "blob" },
      );
      expect(clickMock).toHaveBeenCalledTimes(1);
      // revokeObjectURL はダウンロード開始を妨げないよう setTimeout で
      // 遅延実行されるため、非同期に完了を待つ
      await waitFor(() =>
        expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url"),
      );
      expect(result.current.exporting).toBe(false);
    });

    it("Content-Disposition のファイル名を使う", async () => {
      let downloadName = "";
      vi.spyOn(document, "createElement").mockImplementation((tagName) => {
        const element = originalCreateElement(tagName);
        if (tagName === "a") {
          element.click = clickMock;
          Object.defineProperty(element, "download", {
            set: (value: string) => {
              downloadName = value;
            },
            get: () => downloadName,
          });
        }
        return element;
      });

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockDetail })
        .mockResolvedValueOnce({
          data: new Blob(["csv"]),
          headers: {
            "content-disposition":
              'attachment; filename="import_history_1.csv"',
          },
        });

      const { result } = renderHook(() => useFetchHistoryDetail(1));
      await waitFor(() => expect(result.current.data).not.toBeNull());

      await act(async () => {
        await result.current.onExport();
      });

      expect(downloadName).toBe("import_history_1.csv");
    });

    it("RFC5987形式(filename*=)のファイル名を優先してデコードする", async () => {
      let downloadName = "";
      vi.spyOn(document, "createElement").mockImplementation((tagName) => {
        const element = originalCreateElement(tagName);
        if (tagName === "a") {
          element.click = clickMock;
          Object.defineProperty(element, "download", {
            set: (value: string) => {
              downloadName = value;
            },
            get: () => downloadName,
          });
        }
        return element;
      });

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockDetail })
        .mockResolvedValueOnce({
          data: new Blob(["csv"]),
          headers: {
            "content-disposition":
              "attachment; filename*=UTF-8''%E5%B1%A5%E6%AD%B4.csv",
          },
        });

      const { result } = renderHook(() => useFetchHistoryDetail(1));
      await waitFor(() => expect(result.current.data).not.toBeNull());

      await act(async () => {
        await result.current.onExport();
      });

      // filename*= の中身が誤って素のfilenameとして拾われず、
      // 正しくデコードされること
      expect(downloadName).toBe("履歴.csv");
    });

    it("失敗時はSnackbarにエラーを表示する", async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockDetail })
        .mockRejectedValueOnce({ response: { status: 500 } });

      const { result } = renderHook(() => useFetchHistoryDetail(1));
      await waitFor(() => expect(result.current.data).not.toBeNull());

      await act(async () => {
        await result.current.onExport();
      });

      expect(result.current.snackbar.open).toBe(true);
      expect(result.current.snackbar.severity).toBe("error");
      expect(result.current.exporting).toBe(false);
      expect(clickMock).not.toHaveBeenCalled();
    });

    it("401エラー時はログイン画面へリダイレクトする", async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockDetail })
        .mockRejectedValueOnce({ response: { status: 401 } });

      const { result } = renderHook(() => useFetchHistoryDetail(1));
      await waitFor(() => expect(result.current.data).not.toBeNull());

      await act(async () => {
        await result.current.onExport();
      });

      expect(pushMock).toHaveBeenCalledWith("/login");
      expect(result.current.snackbar.open).toBe(false);
    });
  });
});
