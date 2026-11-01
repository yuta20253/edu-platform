"use client";

import { useToast } from "@/components/ui/ToastProvider";
import { apiClient } from "@/libs/http/apiClient";
import { buildErrorMessage } from "@/libs/http/buildErrorMessage";
import { extractApiError } from "@/libs/http/extractApiError";
import type { SchoolClassRequest } from "@/types/schoolClassRequest/schoolClassRequest";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// 409: 他の教員が先に承認/却下した、申請者が取り消した、または lock_version の競合
// 422: 取消しようとした申請が既に承認待ちでなくなっている
// いずれも画面の申請情報が古いため、最新の状態を取り直す
const isStaleRequestError = (status?: number) =>
  status === 409 || status === 422;

export const useSchoolClassRequestDetail = (schoolClassRequestId: number) => {
  const [request, setRequest] = useState<SchoolClassRequest | null>(null);
  const [error, setError] = useState(false);
  // 承認・却下・取消のダイアログに出すエラー(同時に開くダイアログは1つ)
  const [actionError, setActionError] = useState("");
  const router = useRouter();
  const { show } = useToast();

  const basePath = `/api/teacher/school-class-requests/${schoolClassRequestId}`;

  // 最後に出した取得の番号。取得が重なったとき(操作後の取り直しと再試行など)、後から届いた古い結果で上書きしない
  const latestFetchRef = useRef(0);

  // 取り直し中も前回の申請情報は残す(画面全体がスピナーに戻らないようにする)
  const fetchDetail = useCallback(async () => {
    const fetchId = ++latestFetchRef.current;
    setError(false);
    try {
      const res = await apiClient.get<SchoolClassRequest>(basePath);
      if (fetchId !== latestFetchRef.current) return;
      setRequest(res.data);
    } catch (err) {
      if (fetchId !== latestFetchRef.current) return;
      if (extractApiError(err).status === 401) {
        router.push("/login");
        return;
      }
      setError(true);
    }
  }, [basePath, router]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // 承認・却下・取消の共通処理。成功時に true を返す
  const runAction = async (
    send: () => Promise<unknown>,
    successMessage: string,
    fallbackError: string,
  ): Promise<boolean> => {
    setActionError("");
    try {
      await send();
      show({ message: successMessage, severity: "success" });
      await fetchDetail();
      return true;
    } catch (err) {
      const { status, errors } = extractApiError(err);
      if (status === 401) {
        router.push("/login");
        return false;
      }
      setActionError(buildErrorMessage(errors, fallbackError));
      if (isStaleRequestError(status)) await fetchDetail();
      return false;
    }
  };

  // 画面を開いた時点の lock_version を送り、他の教員が先に処理していれば 409 にする
  const approve = () =>
    runAction(
      () =>
        apiClient.patch(basePath, {
          status: "approved",
          lock_version: request?.lock_version,
        }),
      "申請を承認しました",
      "申請の承認に失敗しました",
    );

  const reject = (reason: string) =>
    runAction(
      () =>
        apiClient.patch(basePath, {
          status: "rejected",
          lock_version: request?.lock_version,
          reason,
        }),
      "申請を却下しました",
      "申請の却下に失敗しました",
    );

  const cancel = (reason: string) =>
    runAction(
      () => apiClient.delete(basePath, { data: { reason } }),
      "申請を取り消しました",
      "申請の取消に失敗しました",
    );

  return {
    request,
    error,
    retry: fetchDetail,
    approve,
    reject,
    cancel,
    actionError,
    clearActionError: () => setActionError(""),
  };
};
