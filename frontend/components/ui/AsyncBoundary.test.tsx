import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AsyncBoundary } from "./AsyncBoundary";

describe("AsyncBoundary", () => {
  it("errorがあればエラー表示になる", () => {
    render(
      <AsyncBoundary data={null} error={true}>
        {() => <div>成功</div>}
      </AsyncBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("成功")).not.toBeInTheDocument();
  });

  it("dataがあってもerrorがあればエラー表示を優先する", () => {
    render(
      <AsyncBoundary data={{ name: "a" }} error={true}>
        {() => <div>成功</div>}
      </AsyncBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("成功")).not.toBeInTheDocument();
  });

  it("onRetryを渡すと再試行ボタンが表示されクリックで呼ばれる", () => {
    const onRetry = vi.fn();
    render(
      <AsyncBoundary data={null} error={true} onRetry={onRetry}>
        {() => <div>成功</div>}
      </AsyncBoundary>,
    );
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("onRetryを渡さない場合は再試行ボタンが表示されない", () => {
    render(
      <AsyncBoundary data={null} error={true}>
        {() => <div>成功</div>}
      </AsyncBoundary>,
    );
    expect(
      screen.queryByRole("button", { name: "再試行" }),
    ).not.toBeInTheDocument();
  });

  it("dataもerrorもなければスピナーを表示しchildrenは呼ばない", () => {
    const children = vi.fn(() => <div>成功</div>);
    render(<AsyncBoundary data={null}>{children}</AsyncBoundary>);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(children).not.toHaveBeenCalled();
  });

  it("dataがundefinedでもスピナーを表示する", () => {
    render(
      <AsyncBoundary data={undefined}>{() => <div>成功</div>}</AsyncBoundary>,
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("dataがあればchildrenにdataを渡して成功表示にする", () => {
    render(
      <AsyncBoundary data={{ name: "山田" }}>
        {(data) => <div>{data.name}</div>}
      </AsyncBoundary>,
    );
    expect(screen.getByText("山田")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("0や空配列などfalsyなdataもローディングにせず成功表示にする", () => {
    const { rerender } = render(
      <AsyncBoundary data={0}>
        {(data) => <div>件数:{data}</div>}
      </AsyncBoundary>,
    );
    expect(screen.getByText("件数:0")).toBeInTheDocument();

    rerender(
      <AsyncBoundary data={[] as string[]}>
        {(data) => <div>要素数:{data.length}</div>}
      </AsyncBoundary>,
    );
    expect(screen.getByText("要素数:0")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("再取得中もdataが残っていれば前回の内容を表示し続ける", () => {
    const { rerender } = render(
      <AsyncBoundary data={{ page: 1 }}>
        {(data) => <div>ページ{data.page}</div>}
      </AsyncBoundary>,
    );
    expect(screen.getByText("ページ1")).toBeInTheDocument();

    // 再取得中: dataは前回のまま、errorもない
    rerender(
      <AsyncBoundary data={{ page: 1 }} error={false}>
        {(data) => <div>ページ{data.page}</div>}
      </AsyncBoundary>,
    );
    expect(screen.getByText("ページ1")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    // 取得完了: 新しいdataに切り替わる
    rerender(
      <AsyncBoundary data={{ page: 2 }}>
        {(data) => <div>ページ{data.page}</div>}
      </AsyncBoundary>,
    );
    expect(screen.getByText("ページ2")).toBeInTheDocument();
  });

  describe("fallback", () => {
    it("card-skeletonを指定するとカードのスケルトンを表示しスピナーは出さない", () => {
      render(
        <AsyncBoundary data={null} fallback="card-skeleton">
          {() => <div>成功</div>}
        </AsyncBoundary>,
      );
      expect(document.querySelectorAll(".MuiSkeleton-root")).toHaveLength(3);
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("table-skeletonを指定するとテーブルのスケルトンを表示しスピナーは出さない", () => {
      render(
        <AsyncBoundary data={null} fallback="table-skeleton">
          {() => <div>成功</div>}
        </AsyncBoundary>,
      );
      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("row")).toHaveLength(5);
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("skeletonPropsでテーブルの行数・列数とカードの行数を変更できる", () => {
      const { unmount } = render(
        <AsyncBoundary
          data={null}
          fallback="table-skeleton"
          skeletonProps={{ rows: 2, columns: 3 }}
        >
          {() => <div>成功</div>}
        </AsyncBoundary>,
      );
      expect(screen.getAllByRole("row")).toHaveLength(2);
      expect(document.querySelectorAll(".MuiSkeleton-root")).toHaveLength(6);
      unmount();

      render(
        <AsyncBoundary
          data={null}
          fallback="card-skeleton"
          skeletonProps={{ lines: 5 }}
        >
          {() => <div>成功</div>}
        </AsyncBoundary>,
      );
      expect(document.querySelectorAll(".MuiSkeleton-root")).toHaveLength(5);
    });

    it("errorがあればfallbackに関わらずエラー表示を優先する", () => {
      render(
        <AsyncBoundary data={null} error={true} fallback="table-skeleton">
          {() => <div>成功</div>}
        </AsyncBoundary>,
      );
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });

  it("errorMessageを渡すとエラー表示のメッセージを上書きできる", () => {
    render(
      <AsyncBoundary
        data={null}
        error={true}
        errorMessage="ダッシュボードの取得に失敗しました"
      >
        {() => <div>成功</div>}
      </AsyncBoundary>,
    );
    expect(
      screen.getByText("ダッシュボードの取得に失敗しました"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("データの取得に失敗しました"),
    ).not.toBeInTheDocument();
  });

  it("errorMessageを渡さなければデフォルトのメッセージを表示する", () => {
    render(
      <AsyncBoundary data={null} error={true}>
        {() => <div>成功</div>}
      </AsyncBoundary>,
    );
    expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();
  });
});
