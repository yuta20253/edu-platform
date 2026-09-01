import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
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

  it("初期状態はstep1で、プリセットがなければisPresetはfalse", () => {
    const { result } = renderHook(() =>
      useCsvImport({ presetCourseId: null, presetUnitId: null }),
    );
    expect(result.current.state.step).toBe(1);
    expect(result.current.state.isPreset).toBe(false);
    expect(result.current.state.courseId).toBeNull();
    expect(result.current.state.mode).toBe("append");
  });

  it("courseId/unitIdプリセットがあればisPresetはtrueで初期値にセットされる", () => {
    const { result } = renderHook(() =>
      useCsvImport({ presetCourseId: 7, presetUnitId: 11 }),
    );
    expect(result.current.state.isPreset).toBe(true);
    expect(result.current.state.courseId).toBe(7);
    expect(result.current.state.unitId).toBe(11);
  });

  it("拡張子が.csv以外のファイルはfileErrorになりfileはセットされない", () => {
    const { result } = renderHook(() =>
      useCsvImport({ presetCourseId: null, presetUnitId: null }),
    );
    act(() => {
      result.current.handleFileSelect(csvFile("questions.txt", 100));
    });
    expect(result.current.state.file).toBeNull();
    expect(result.current.state.fileError).toBe(
      "CSVファイル（.csv）のみアップロード可能です",
    );
  });

  it("5MBを超えるファイルはfileErrorになりfileはセットされない", () => {
    const { result } = renderHook(() =>
      useCsvImport({ presetCourseId: null, presetUnitId: null }),
    );
    act(() => {
      result.current.handleFileSelect(
        csvFile("questions.csv", 5 * 1024 * 1024 + 1),
      );
    });
    expect(result.current.state.file).toBeNull();
    expect(result.current.state.fileError).toBe(
      "ファイルサイズは5MB以内にしてください",
    );
  });

  it("正常なCSVファイルはfileにセットされfileErrorはnull", () => {
    const { result } = renderHook(() =>
      useCsvImport({ presetCourseId: null, presetUnitId: null }),
    );
    const file = csvFile("questions.csv", 100);
    act(() => {
      result.current.handleFileSelect(file);
    });
    expect(result.current.state.file).toBe(file);
    expect(result.current.state.fileError).toBeNull();
  });

  it("handleFileClearでfile/fileError/dryRunResultがリセットされる", () => {
    const { result } = renderHook(() =>
      useCsvImport({ presetCourseId: null, presetUnitId: null }),
    );
    act(() => {
      result.current.handleFileSelect(csvFile("questions.csv", 100));
    });
    act(() => {
      result.current.handleFileClear();
    });
    expect(result.current.state.file).toBeNull();
    expect(result.current.state.fileError).toBeNull();
    expect(result.current.state.dryRunResult).toBeNull();
  });

  it("handleCourseChangeで講座を変更するとunitIdがリセットされる", () => {
    const { result } = renderHook(() =>
      useCsvImport({ presetCourseId: null, presetUnitId: null }),
    );
    act(() => {
      result.current.handleUnitChange(3);
    });
    act(() => {
      result.current.handleCourseChange(5);
    });
    expect(result.current.state.courseId).toBe(5);
    expect(result.current.state.unitId).toBeNull();
  });

  it("handleModeChangeでdryRunResultがリセットされる", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { total_count: 1, valid_count: 1, rows: [] },
    });
    const { result } = renderHook(() =>
      useCsvImport({ presetCourseId: 1, presetUnitId: 2 }),
    );
    act(() => {
      result.current.handleFileSelect(csvFile("questions.csv", 100));
    });
    await act(async () => {
      await result.current.goNext();
    });
    await waitFor(() =>
      expect(result.current.state.dryRunResult).not.toBeNull(),
    );

    act(() => {
      result.current.handleModeChange("overwrite");
    });
    expect(result.current.state.mode).toBe("overwrite");
    expect(result.current.state.dryRunResult).toBeNull();
  });

  it("goBackはstepを1つ戻すが1未満にはならない", () => {
    const { result } = renderHook(() =>
      useCsvImport({ presetCourseId: null, presetUnitId: null }),
    );
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
          rows: [{ row_number: 3, severity: "error", message: "NG", data: {} }],
        },
      });
      const { result } = renderHook(() =>
        useCsvImport({ presetCourseId: 1, presetUnitId: 2 }),
      );
      act(() => {
        result.current.handleFileSelect(csvFile("questions.csv", 100));
      });
      await act(async () => {
        await result.current.goNext();
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/admin/courses/1/units/2/import_questions/dry_run",
        expect.any(FormData),
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      expect(result.current.state.step).toBe(2);
      expect(result.current.state.dryRunResult?.valid_count).toBe(2);
      expect(result.current.state.dryRunResult?.rows).toHaveLength(1);
    });

    it("courseId/unitIdが欠けている場合はAPIを呼ばずfileErrorにメッセージが入る（NaNプリセット等のガード）", async () => {
      const { result } = renderHook(() =>
        useCsvImport({ presetCourseId: null, presetUnitId: null }),
      );
      act(() => {
        result.current.handleFileSelect(csvFile("questions.csv", 100));
      });
      await act(async () => {
        await result.current.goNext();
      });

      expect(apiClient.post).not.toHaveBeenCalled();
      expect(result.current.state.step).toBe(1);
      expect(result.current.state.dryRunLoading).toBe(false);
      expect(result.current.state.fileError).toBe(
        "講座・単元・CSVファイルを正しく選択してください。URLが不正な可能性があります",
      );
    });

    it("422エラー時はstep2へ遷移しdryRunErrorにメッセージが入る", async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: {
          status: 422,
          data: { errors: ["CSVファイルのみアップロード可能です"] },
        },
      });
      const { result } = renderHook(() =>
        useCsvImport({ presetCourseId: 1, presetUnitId: 2 }),
      );
      act(() => {
        result.current.handleFileSelect(csvFile("questions.csv", 100));
      });
      await act(async () => {
        await result.current.goNext();
      });

      expect(result.current.state.step).toBe(2);
      expect(result.current.state.dryRunError).toBe(
        "CSVファイルのみアップロード可能です",
      );
      expect(result.current.state.dryRunResult).toBeNull();
    });

    it("401エラー時はログイン画面へリダイレクトする", async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: { status: 401 },
      });
      const { result } = renderHook(() =>
        useCsvImport({ presetCourseId: 1, presetUnitId: 2 }),
      );
      act(() => {
        result.current.handleFileSelect(csvFile("questions.csv", 100));
      });
      await act(async () => {
        await result.current.goNext();
      });

      expect(pushMock).toHaveBeenCalledWith("/login");
    });

    it("404エラー時はisPresetを解除してStep1選択に戻す", async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: { status: 404 },
      });
      const { result } = renderHook(() =>
        useCsvImport({ presetCourseId: 1, presetUnitId: 2 }),
      );
      act(() => {
        result.current.handleFileSelect(csvFile("questions.csv", 100));
      });
      await act(async () => {
        await result.current.goNext();
      });

      expect(result.current.state.isPreset).toBe(false);
      expect(result.current.state.courseId).toBeNull();
      expect(result.current.state.unitId).toBeNull();
      expect(result.current.state.dryRunError).toBe(
        "指定された講座・単元が見つかりません。選択し直してください",
      );
    });

    it("dry_run結果にエラー行があるとstep2からstep3へgoNextしても進まない", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          total_count: 1,
          valid_count: 0,
          rows: [{ row_number: 2, severity: "error", message: "NG", data: {} }],
        },
      });
      const { result } = renderHook(() =>
        useCsvImport({ presetCourseId: 1, presetUnitId: 2 }),
      );
      act(() => {
        result.current.handleFileSelect(csvFile("questions.csv", 100));
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
      const { result } = renderHook(() =>
        useCsvImport({ presetCourseId: 1, presetUnitId: 2 }),
      );
      act(() => {
        result.current.handleFileSelect(csvFile("questions.csv", 100));
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
      const { result } = renderHook(() =>
        useCsvImport({ presetCourseId: 1, presetUnitId: 2 }),
      );
      act(() => {
        result.current.handleFileSelect(csvFile("questions.csv", 100));
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
        "/api/admin/courses/1/units/2/import_questions",
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
      const { result } = renderHook(() =>
        useCsvImport({ presetCourseId: 1, presetUnitId: 2 }),
      );
      act(() => {
        result.current.handleFileSelect(csvFile("questions.csv", 100));
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
      const { result } = renderHook(() =>
        useCsvImport({ presetCourseId: 1, presetUnitId: 2 }),
      );
      act(() => {
        result.current.handleFileSelect(csvFile("questions.csv", 100));
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
});
