import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { useCsvImport } from "./useCsvImport";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: vi.fn() },
}));

const csvFile = (name: string, sizeBytes: number) => {
  const file = new File(["a".repeat(Math.min(sizeBytes, 10))], name, {
    type: "text/csv",
  });
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
};

describe("useCsvImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初期状態はstep1でfileはnull", () => {
    const { result } = renderHook(() => useCsvImport());
    expect(result.current.state.step).toBe(1);
    expect(result.current.state.file).toBeNull();
    expect(result.current.state.fileError).toBeNull();
  });

  it("拡張子が.csv以外のファイルはfileErrorになりfileはセットされない", () => {
    const { result } = renderHook(() => useCsvImport());
    act(() => {
      result.current.handleFileSelect(csvFile("students.txt", 100));
    });
    expect(result.current.state.file).toBeNull();
    expect(result.current.state.fileError).toBe(
      "CSVファイル（.csv）のみアップロード可能です",
    );
  });

  it("5MBを超えるファイルはfileErrorになりfileはセットされない", () => {
    const { result } = renderHook(() => useCsvImport());
    act(() => {
      result.current.handleFileSelect(
        csvFile("students.csv", 5 * 1024 * 1024 + 1),
      );
    });
    expect(result.current.state.file).toBeNull();
    expect(result.current.state.fileError).toBe(
      "ファイルサイズは5MB以内にしてください",
    );
  });

  it("正常なCSVファイルはfileにセットされfileErrorはnull", () => {
    const { result } = renderHook(() => useCsvImport());
    const file = csvFile("students.csv", 100);
    act(() => {
      result.current.handleFileSelect(file);
    });
    expect(result.current.state.file).toBe(file);
    expect(result.current.state.fileError).toBeNull();
  });

  it("handleFileClearでfile/fileError/dryRunResultがリセットされる", () => {
    const { result } = renderHook(() => useCsvImport());
    act(() => {
      result.current.handleFileSelect(csvFile("students.csv", 100));
    });
    act(() => {
      result.current.handleFileClear();
    });
    expect(result.current.state.file).toBeNull();
    expect(result.current.state.fileError).toBeNull();
    expect(result.current.state.dryRunResult).toBeNull();
  });

  it("goBackはstepを1つ戻すが1未満にはならない", () => {
    const { result } = renderHook(() => useCsvImport());
    act(() => {
      result.current.goBack();
    });
    expect(result.current.state.step).toBe(1);
  });

  describe("dry_run", () => {
    it("step1でgoNextするとdry_runを呼びstep2へ遷移し結果が保持される", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          total_count: 3,
          valid_count: 2,
          rows: [{ row_number: 3, severity: "error", message: "NG" }],
        },
      });
      const { result } = renderHook(() => useCsvImport());
      act(() => {
        result.current.handleFileSelect(csvFile("students.csv", 100));
      });
      await act(async () => {
        await result.current.goNext();
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/teacher/import_students/dry_run",
        expect.any(FormData),
        {
          headers: { "Content-Type": "multipart/form-data" },
          signal: expect.any(AbortSignal),
        },
      );
      expect(result.current.state.step).toBe(2);
      expect(result.current.state.dryRunResult?.valid_count).toBe(2);
      expect(result.current.state.dryRunResult?.rows).toHaveLength(1);
    });

    it("ドライラン中にファイルを差し替えるとabortされ、古い結果は反映されない", async () => {
      let dryRunSignal: AbortSignal | undefined;
      vi.mocked(apiClient.post).mockImplementation((_url, _data, config) => {
        dryRunSignal = config?.signal as AbortSignal;
        // abortされるとキャンセルエラーで reject される
        return new Promise((_resolve, reject) => {
          config?.signal?.addEventListener?.("abort", () =>
            reject(new axios.CanceledError()),
          );
        });
      });
      const { result } = renderHook(() => useCsvImport());
      act(() => {
        result.current.handleFileSelect(csvFile("a.csv", 100));
      });

      let pending: Promise<void> | undefined;
      act(() => {
        pending = result.current.goNext();
      });
      expect(result.current.state.dryRunLoading).toBe(true);
      expect(dryRunSignal?.aborted).toBe(false);

      const fileB = csvFile("b.csv", 100);
      act(() => {
        result.current.handleFileSelect(fileB);
      });
      await act(async () => {
        await pending;
      });

      expect(dryRunSignal?.aborted).toBe(true);
      expect(result.current.state.file).toBe(fileB);
      expect(result.current.state.step).toBe(1);
      expect(result.current.state.dryRunLoading).toBe(false);
      expect(result.current.state.dryRunResult).toBeNull();
      expect(result.current.state.dryRunError).toBeNull();
      expect(pushMock).not.toHaveBeenCalled();
    });

    it("ファイル未選択の場合はAPIを呼ばずfileErrorにメッセージが入る", async () => {
      const { result } = renderHook(() => useCsvImport());
      await act(async () => {
        await result.current.goNext();
      });

      expect(apiClient.post).not.toHaveBeenCalled();
      expect(result.current.state.step).toBe(1);
      expect(result.current.state.dryRunLoading).toBe(false);
      expect(result.current.state.fileError).toBe(
        "CSVファイルを選択してください",
      );
    });

    it("422エラー時はstep2へ遷移しdryRunErrorにメッセージが入る", async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: {
          status: 422,
          data: { errors: ["CSVのフォーマットが不正です"] },
        },
      });
      const { result } = renderHook(() => useCsvImport());
      act(() => {
        result.current.handleFileSelect(csvFile("students.csv", 100));
      });
      await act(async () => {
        await result.current.goNext();
      });

      expect(result.current.state.step).toBe(2);
      expect(result.current.state.dryRunError).toBe(
        "CSVのフォーマットが不正です",
      );
      expect(result.current.state.dryRunResult).toBeNull();
    });

    it("401エラー時はログイン画面へリダイレクトする", async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: { status: 401 },
      });
      const { result } = renderHook(() => useCsvImport());
      act(() => {
        result.current.handleFileSelect(csvFile("students.csv", 100));
      });
      await act(async () => {
        await result.current.goNext();
      });

      expect(pushMock).toHaveBeenCalledWith("/login");
    });

    it("dry_run結果にエラー行があるとstep2からstep3へgoNextしても進まない", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          total_count: 1,
          valid_count: 0,
          rows: [{ row_number: 2, severity: "error", message: "NG" }],
        },
      });
      const { result } = renderHook(() => useCsvImport());
      act(() => {
        result.current.handleFileSelect(csvFile("students.csv", 100));
      });
      await act(async () => {
        await result.current.goNext();
      });
      expect(result.current.state.step).toBe(2);

      await act(async () => {
        await result.current.goNext();
      });
      expect(result.current.state.step).toBe(2);
    });

    it("dry_run結果にエラー行がなければstep2からstep3へ進める", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { total_count: 1, valid_count: 1, rows: [] },
      });
      const { result } = renderHook(() => useCsvImport());
      act(() => {
        result.current.handleFileSelect(csvFile("students.csv", 100));
      });
      await act(async () => {
        await result.current.goNext();
      });
      expect(result.current.state.step).toBe(2);

      await act(async () => {
        await result.current.goNext();
      });
      expect(result.current.state.step).toBe(3);
    });
  });

  describe("submitImport", () => {
    const validDryRunResult = {
      data: { total_count: 1, valid_count: 1, rows: [] },
    };

    it("step3でgoNextすると実行APIを呼び202でstep4へ遷移する", async () => {
      vi.mocked(apiClient.post)
        .mockResolvedValueOnce(validDryRunResult)
        .mockResolvedValueOnce({
          data: { message: "インポートを開始しました" },
        });
      const { result } = renderHook(() => useCsvImport());
      act(() => {
        result.current.handleFileSelect(csvFile("students.csv", 100));
      });
      await act(async () => {
        await result.current.goNext();
      });
      await act(async () => {
        await result.current.goNext();
      });
      expect(result.current.state.step).toBe(3);

      await act(async () => {
        await result.current.goNext();
      });

      expect(apiClient.post).toHaveBeenLastCalledWith(
        "/api/teacher/import_students",
        expect.any(FormData),
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      expect(result.current.state.step).toBe(4);
      expect(result.current.state.importResult?.message).toBe(
        "インポートを開始しました",
      );
    });

    it("実行APIが422を返すとstep3のままsubmitErrorが入る", async () => {
      vi.mocked(apiClient.post)
        .mockResolvedValueOnce(validDryRunResult)
        .mockRejectedValueOnce({
          response: { status: 422, data: { errors: ["バリデーションエラー"] } },
        });
      const { result } = renderHook(() => useCsvImport());
      act(() => {
        result.current.handleFileSelect(csvFile("students.csv", 100));
      });
      await act(async () => {
        await result.current.goNext();
      });
      await act(async () => {
        await result.current.goNext();
      });

      await act(async () => {
        await result.current.goNext();
      });

      expect(result.current.state.step).toBe(3);
      expect(result.current.state.submitError).toBe("バリデーションエラー");
    });

    it("実行APIが401を返すとログイン画面へリダイレクトする", async () => {
      vi.mocked(apiClient.post)
        .mockResolvedValueOnce(validDryRunResult)
        .mockRejectedValueOnce({ response: { status: 401 } });
      const { result } = renderHook(() => useCsvImport());
      act(() => {
        result.current.handleFileSelect(csvFile("students.csv", 100));
      });
      await act(async () => {
        await result.current.goNext();
      });
      await act(async () => {
        await result.current.goNext();
      });

      await act(async () => {
        await result.current.goNext();
      });

      expect(pushMock).toHaveBeenCalledWith("/login");
    });
  });

  describe("resetForNewImport", () => {
    it("完了後にresetForNewImportを呼ぶとstep1に戻り状態が初期化される", async () => {
      vi.mocked(apiClient.post)
        .mockResolvedValueOnce({
          data: { total_count: 1, valid_count: 1, rows: [] },
        })
        .mockResolvedValueOnce({
          data: { message: "インポートを開始しました" },
        });
      const { result } = renderHook(() => useCsvImport());
      act(() => {
        result.current.handleFileSelect(csvFile("students.csv", 100));
      });
      await act(async () => {
        await result.current.goNext();
      });
      await act(async () => {
        await result.current.goNext();
      });
      await act(async () => {
        await result.current.goNext();
      });
      expect(result.current.state.step).toBe(4);

      act(() => {
        result.current.resetForNewImport();
      });

      expect(result.current.state.step).toBe(1);
      expect(result.current.state.file).toBeNull();
      expect(result.current.state.importResult).toBeNull();
    });
  });
});
