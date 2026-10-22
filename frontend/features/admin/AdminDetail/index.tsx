"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useToast } from "@/components/ui/ToastProvider";
import { Presenter } from "./Presenter";
import { useFetchAdminDetail } from "./hooks/useFetchAdminDetail";
import { useUpdateAdmin } from "./hooks/useUpdateAdmin";
import { useDeleteAdmin } from "./hooks/useDeleteAdmin";
import { usePasswordReset } from "./hooks/usePasswordReset";
import type { Prefecture } from "@/types/common/prefecture";

type Props = {
  adminId: number;
  // ログイン中の管理者 ID（自己削除ガード用）。/me 取得失敗時は null。
  // null の場合は本人判定ができないため UI ガードは無効になるが、
  // 自己削除・最後の管理者の削除は バックエンド側でも 422 で防がれる。
  currentAdminId: number | null;
  // 住所カスケード（都道府県プルダウン）用の都道府県一覧
  prefectures: Prefecture[];
};

export const AdminDetail = ({
  adminId,
  currentAdminId,
  prefectures,
}: Props) => {
  const toast = useToast();

  const { admin, setAdmin, fetchError, refetch } = useFetchAdminDetail(adminId);

  const { updating, updateErrors, handleUpdate } = useUpdateAdmin({
    adminId,
    onUpdated: (updated) => {
      // PATCH レスポンスの最新 admin で表示を更新する（再取得しない）
      setAdmin(updated);
      toast.show({ message: "管理者を更新しました" });
    },
  });

  const {
    deleteDialogOpen,
    deleting,
    deleteErrors,
    handleDeleteClick,
    handleDeleteDialogClose,
    handleDeleteConfirm,
  } = useDeleteAdmin({ adminId });

  const { resettingPassword, handlePasswordReset } = usePasswordReset({
    adminId,
    email: admin?.email ?? "",
    onSuccess: () =>
      toast.show({ message: "パスワード再設定メールを送信しました" }),
    onError: () =>
      toast.show({
        message: "パスワード再設定メールの送信に失敗しました",
        severity: "error",
      }),
  });

  return (
    <AsyncBoundary
      data={admin}
      error={fetchError !== null}
      errorMessage={fetchError ?? undefined}
      onRetry={refetch}
      fallback="card-skeleton"
      skeletonProps={{ lines: 6 }}
    >
      {(detail) => (
        <Presenter
          admin={detail}
          prefectures={prefectures}
          isSelf={currentAdminId === detail.id}
          onUpdate={handleUpdate}
          updating={updating}
          updateErrors={updateErrors}
          onPasswordReset={handlePasswordReset}
          resettingPassword={resettingPassword}
          deleteDialogOpen={deleteDialogOpen}
          onDeleteClick={handleDeleteClick}
          onDeleteDialogClose={handleDeleteDialogClose}
          onDeleteConfirm={handleDeleteConfirm}
          deleting={deleting}
          deleteErrors={deleteErrors}
        />
      )}
    </AsyncBoundary>
  );
};
