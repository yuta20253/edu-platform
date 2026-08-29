import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { ImportHistoriesData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockData: ImportHistoriesData = {
  import_histories: [
    {
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
      created_at: "2026-08-01T10:00:00Z",
    },
    {
      id: 2,
      course: { id: 11, level_name: "標準数学" },
      unit: { id: 101, unit_name: "単元2" },
      user: { id: 1001, name: "実行花子" },
      file_name: "questions2.csv",
      status: "failed",
      mode: "overwrite",
      total_count: 5,
      success_count: 0,
      error_count: 5,
      created_at: "2026-08-02T10:00:00Z",
    },
  ],
  meta: {
    current_page: 1,
    total_pages: 3,
    total_count: 50,
    per_page: 20,
  },
};

const defaultProps = {
  data: mockData,
  filters: {
    status: "" as const,
    courseId: "",
    unitId: "",
    userId: "",
    from: "",
    to: "",
  },
  courseOptions: [{ id: 10, level_name: "基礎英語" }],
  unitOptions: [{ id: 100, unit_name: "単元1" }],
  userOptions: [{ id: 1000, name: "実行太郎" }],
  sort: "created_at" as const,
  order: "desc" as const,
  page: 1,
  perPage: 20,
  onStatusChange: vi.fn(),
  onCourseChange: vi.fn(),
  onUnitChange: vi.fn(),
  onUserChange: vi.fn(),
  onFromChange: vi.fn(),
  onToChange: vi.fn(),
  onSortChange: vi.fn(),
  onPageChange: vi.fn(),
  onPerPageChange: vi.fn(),
  onClearFilters: vi.fn(),
  onRowClick: vi.fn(),
};

describe("AdminImportHistoryPresenter", () => {
  it("テーブルヘッダーに指定された列が表示される", () => {
    render(<Presenter {...defaultProps} />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toContain("日時");
    expect(headers).toContain("コース");
    expect(headers).toContain("単元");
    expect(headers).toContain("件数");
    expect(
      headers.some((h) => h?.includes("成功数") && h?.includes("エラー数")),
    ).toBe(true);
    expect(headers).toContain("実行者");
    expect(headers).toContain("ステータス");
  });

  it("import_histories データが行として正しくレンダリングされる", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("基礎英語")).toBeInTheDocument();
    expect(screen.getByText("単元1")).toBeInTheDocument();
    expect(screen.getByText("実行太郎")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("8 / 2")).toBeInTheDocument();

    expect(screen.getByText("標準数学")).toBeInTheDocument();
    expect(screen.getByText("単元2")).toBeInTheDocument();
    expect(screen.getByText("実行花子")).toBeInTheDocument();
  });

  it("ステータスバッジが completed=完了 で表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("完了")).toBeInTheDocument();
  });

  it("ステータスバッジが failed=失敗 で表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("失敗")).toBeInTheDocument();
  });

  it("ステータスバッジが processing=処理中、pending=待機中 で表示される", () => {
    const data: ImportHistoriesData = {
      ...mockData,
      import_histories: [
        { ...mockData.import_histories[0], id: 3, status: "processing" },
        { ...mockData.import_histories[0], id: 4, status: "pending" },
      ],
    };
    render(<Presenter {...defaultProps} data={data} />);
    expect(screen.getByText("処理中")).toBeInTheDocument();
    expect(screen.getByText("待機中")).toBeInTheDocument();
  });

  it("courseId が未設定の行はコース/単元が「-」で表示される", () => {
    const data: ImportHistoriesData = {
      ...mockData,
      import_histories: [
        { ...mockData.import_histories[0], id: 5, course: null, unit: null },
      ],
    };
    render(<Presenter {...defaultProps} data={data} />);
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("created_at が不正な値でもクラッシュせず「-」で表示される", () => {
    const data: ImportHistoriesData = {
      ...mockData,
      import_histories: [
        { ...mockData.import_histories[0], id: 6, created_at: "" },
      ],
    };
    expect(() =>
      render(<Presenter {...defaultProps} data={data} />),
    ).not.toThrow();
  });

  it("フィルタが未設定のとき、個別クリアボタンと一括クリアボタンは表示されない", () => {
    render(<Presenter {...defaultProps} />);
    expect(
      screen.queryByRole("button", { name: "ステータスをクリア" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "フィルタを全てクリア" }),
    ).not.toBeInTheDocument();
  });

  it("ステータスフィルタ設定時、個別クリアボタンで onStatusChange('') が呼ばれる", () => {
    const onStatusChange = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        filters={{ ...defaultProps.filters, status: "completed" }}
        onStatusChange={onStatusChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "ステータスをクリア" }));
    expect(onStatusChange).toHaveBeenCalledWith("");
  });

  it("コースフィルタ設定時、個別クリアボタンで onCourseChange('') が呼ばれる", () => {
    const onCourseChange = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        filters={{ ...defaultProps.filters, courseId: "10" }}
        onCourseChange={onCourseChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "コースをクリア" }));
    expect(onCourseChange).toHaveBeenCalledWith("");
  });

  it("単元フィルタ設定時、個別クリアボタンで onUnitChange('') が呼ばれる", () => {
    const onUnitChange = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        filters={{ ...defaultProps.filters, unitId: "100" }}
        onUnitChange={onUnitChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "単元をクリア" }));
    expect(onUnitChange).toHaveBeenCalledWith("");
  });

  it("実行者フィルタ設定時、個別クリアボタンで onUserChange('') が呼ばれる", () => {
    const onUserChange = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        filters={{ ...defaultProps.filters, userId: "1000" }}
        onUserChange={onUserChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "実行者をクリア" }));
    expect(onUserChange).toHaveBeenCalledWith("");
  });

  it("開始日フィルタ設定時、個別クリアボタンで onFromChange('') が呼ばれる", () => {
    const onFromChange = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        filters={{ ...defaultProps.filters, from: "2026-08-01" }}
        onFromChange={onFromChange}
      />,
    );
    const clearButtons = screen.getAllByRole("button", { name: "クリア" });
    fireEvent.click(clearButtons[0]);
    expect(onFromChange).toHaveBeenCalledWith("");
  });

  it("終了日フィルタ設定時、個別クリアボタンで onToChange('') が呼ばれる", () => {
    const onToChange = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        filters={{ ...defaultProps.filters, to: "2026-08-20" }}
        onToChange={onToChange}
      />,
    );
    const clearButtons = screen.getAllByRole("button", { name: "クリア" });
    fireEvent.click(clearButtons[0]);
    expect(onToChange).toHaveBeenCalledWith("");
  });

  it("いずれかのフィルタが設定されているとき、一括クリアボタンが表示され onClearFilters が呼ばれる", () => {
    const onClearFilters = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        filters={{ ...defaultProps.filters, status: "completed" }}
        onClearFilters={onClearFilters}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "フィルタを全てクリア" }),
    );
    expect(onClearFilters).toHaveBeenCalled();
  });

  it("ステータスセレクトの変更で onStatusChange が呼ばれる", () => {
    const onStatusChange = vi.fn();
    render(<Presenter {...defaultProps} onStatusChange={onStatusChange} />);
    const select = screen.getByLabelText("ステータス");
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByRole("option", { name: "完了" }));
    expect(onStatusChange).toHaveBeenCalledWith("completed");
  });

  it("コースセレクトの変更で onCourseChange が呼ばれる", () => {
    const onCourseChange = vi.fn();
    render(<Presenter {...defaultProps} onCourseChange={onCourseChange} />);
    const select = screen.getByLabelText("コース");
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByRole("option", { name: "基礎英語" }));
    expect(onCourseChange).toHaveBeenCalledWith("10");
  });

  it("単元セレクトの変更で onUnitChange が呼ばれる", () => {
    const onUnitChange = vi.fn();
    render(<Presenter {...defaultProps} onUnitChange={onUnitChange} />);
    const select = screen.getByLabelText("単元");
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByRole("option", { name: "単元1" }));
    expect(onUnitChange).toHaveBeenCalledWith("100");
  });

  it("実行者セレクトの変更で onUserChange が呼ばれる", () => {
    const onUserChange = vi.fn();
    render(<Presenter {...defaultProps} onUserChange={onUserChange} />);
    const select = screen.getByLabelText("実行者");
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByRole("option", { name: "実行太郎" }));
    expect(onUserChange).toHaveBeenCalledWith("1000");
  });

  it("日時ヘッダーをクリックすると onSortChange が呼ばれる", () => {
    const onSortChange = vi.fn();
    render(<Presenter {...defaultProps} onSortChange={onSortChange} />);
    const sortButton = screen.getByRole("button", { name: /日時/ });
    fireEvent.click(sortButton);
    expect(onSortChange).toHaveBeenCalledWith("created_at");
  });

  it("件数ヘッダーをクリックすると onSortChange が呼ばれる", () => {
    const onSortChange = vi.fn();
    render(<Presenter {...defaultProps} onSortChange={onSortChange} />);
    const sortButton = screen.getByRole("button", { name: /件数/ });
    fireEvent.click(sortButton);
    expect(onSortChange).toHaveBeenCalledWith("total_count");
  });

  it("成功数ソートボタンをクリックすると onSortChange が success_count で呼ばれる", () => {
    const onSortChange = vi.fn();
    render(<Presenter {...defaultProps} onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole("button", { name: "成功数" }));
    expect(onSortChange).toHaveBeenCalledWith("success_count");
  });

  it("エラー数ソートボタンをクリックすると onSortChange が error_count で呼ばれる", () => {
    const onSortChange = vi.fn();
    render(<Presenter {...defaultProps} onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole("button", { name: "エラー数" }));
    expect(onSortChange).toHaveBeenCalledWith("error_count");
  });

  it("表示件数プルダウンに 20 / 50 / 100 が表示され、変更で onPerPageChange が呼ばれる", () => {
    const onPerPageChange = vi.fn();
    render(<Presenter {...defaultProps} onPerPageChange={onPerPageChange} />);
    const select = screen.getByLabelText("表示件数");
    fireEvent.mouseDown(select);
    expect(screen.getByRole("option", { name: "20件" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "50件" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "100件" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "50件" }));
    expect(onPerPageChange).toHaveBeenCalledWith("50");
  });

  it("ページネーションが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("行をクリックすると onRowClick が呼ばれる", () => {
    const onRowClick = vi.fn();
    render(<Presenter {...defaultProps} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText("基礎英語"));
    expect(onRowClick).toHaveBeenCalledWith(1);
  });

  it("終了日が開始日より前のとき、終了日フィールドにエラーが表示される", () => {
    render(
      <Presenter
        {...defaultProps}
        filters={{
          ...defaultProps.filters,
          from: "2026-08-20",
          to: "2026-08-01",
        }}
      />,
    );
    expect(
      screen.getByText("終了日は開始日以降の日付を指定してください"),
    ).toBeInTheDocument();
  });

  it("開始日が終了日以前のとき、日付レンジのエラーは表示されない", () => {
    render(
      <Presenter
        {...defaultProps}
        filters={{
          ...defaultProps.filters,
          from: "2026-08-01",
          to: "2026-08-20",
        }}
      />,
    );
    expect(
      screen.queryByText("終了日は開始日以降の日付を指定してください"),
    ).not.toBeInTheDocument();
  });

  it("import_histories が空のとき「見つかりません」が表示される", () => {
    render(
      <Presenter
        {...defaultProps}
        data={{ ...mockData, import_histories: [] }}
      />,
    );
    expect(
      screen.getByText("インポート履歴が見つかりません"),
    ).toBeInTheDocument();
  });
});
