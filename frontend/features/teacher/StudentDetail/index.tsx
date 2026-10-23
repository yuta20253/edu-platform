"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { Presenter } from "./Presenter";
import { useStudent } from "./hooks/useStudent";

type Props = {
  studentId: number;
};

export const StudentDetail = ({ studentId }: Props) => {
  const { data, tab, page, loading, error, changeTab, setPage, refetch } =
    useStudent(studentId);

  // 最初の読み込みとその失敗だけ AsyncBoundary で画面全体に出す。
  // タブ切り替え中・切り替え後の失敗は、ヘッダーを残したままPresenterの中で出す
  // (data があるときは error を渡さず、ヘッダーごとエラー表示に置き換えない)
  return (
    <AsyncBoundary data={data} error={!data && error} onRetry={refetch}>
      {(student) => (
        <Presenter
          tab={tab}
          data={student}
          loading={loading}
          error={error}
          page={page}
          onTabChange={changeTab}
          onPageChange={setPage}
        />
      )}
    </AsyncBoundary>
  );
};
