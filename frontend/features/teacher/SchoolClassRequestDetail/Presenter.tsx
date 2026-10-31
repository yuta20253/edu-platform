"use client";

import { colors } from "@/app/theme/colors";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  schoolClassRequestActionLabel,
  schoolClassRequestStatusDefinitions,
} from "@/constants/school_class_request";
import { formatDateTime } from "@/libs/ui/formatDate";
import type { SchoolClassRequest } from "@/types/schoolClassRequest/schoolClassRequest";
import { Box, Button, Card, Typography } from "@mui/material";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ApproveSchoolClassRequestDialog } from "./components/ApproveSchoolClassRequestDialog";
import { SchoolClassRequestReasonDialog } from "./components/SchoolClassRequestReasonDialog";

type Props = {
  request: SchoolClassRequest;
  onApprove: () => Promise<boolean>;
  onReject: (reason: string) => Promise<boolean>;
  onCancel: (reason: string) => Promise<boolean>;
  actionError: string;
  onClearActionError: () => void;
  // 表示中の申請の取り直し(操作の後、再試行)に失敗したか
  refreshError: boolean;
  onRetry: () => void;
};

type OpenDialog = "approve" | "reject" | "cancel" | null;
type ReasonKind = "reject" | "cancel";

const InfoRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <Box sx={{ display: "flex", gap: 2, py: 1 }}>
    <Typography
      component="dt"
      sx={{ flex: "none", width: 112, fontSize: 13 }}
      color="text.secondary"
    >
      {label}
    </Typography>
    <Typography
      component="dd"
      sx={{
        m: 0,
        fontSize: 14,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {children}
    </Typography>
  </Box>
);

const cardSx = {
  border: `1px solid ${colors.border.light}`,
  borderRadius: 2,
  p: 3,
} as const;

export const Presenter = ({
  request,
  onApprove,
  onReject,
  onCancel,
  actionError,
  onClearActionError,
  refreshError,
  onRetry,
}: Props) => {
  // 操作が 409/422 で失敗して申請を取り直し、その操作ができない状態に変わっても、
  // エラーを伝えられるようダイアログは開いたときの種類のまま残す
  const [dialog, setDialog] = useState<OpenDialog>(null);
  // 却下か取消か。閉じるアニメーションの間に文言が切り替わらないよう、閉じても残す
  const [reasonKind, setReasonKind] = useState<ReasonKind>("reject");

  const actionLabel = schoolClassRequestActionLabel[request.action];

  const openReasonDialog = (kind: ReasonKind) => {
    setReasonKind(kind);
    setDialog(kind);
  };

  const closeDialog = () => {
    setDialog(null);
    onClearActionError();
  };

  return (
    <Box sx={{ p: 3, width: "100%", maxWidth: 720 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          fontWeight={700}
          sx={{ color: colors.text.primary }}
        >
          学級{actionLabel}の申請
        </Typography>
        <StatusBadge
          status={request.status}
          definitions={schoolClassRequestStatusDefinitions}
        />
        <Button
          component={Link}
          href="/teacher/school-class-requests"
          variant="outlined"
          size="small"
          sx={{ ml: "auto", height: 32, px: 2, textTransform: "none" }}
        >
          一覧へ戻る
        </Button>
      </Box>

      {/* 画面の内容は前回取得したもののまま。最新の状態にするには再試行してもらう。
          ErrorState は周りに余白(p: 3)を持つので、見出しとカードの間に収まるよう打ち消す */}
      {refreshError && (
        <Box sx={{ mx: -3, mt: -3 }}>
          <ErrorState onRetry={onRetry} />
        </Box>
      )}

      <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
        <Typography component="h2" sx={{ fontWeight: 700, mb: 1 }}>
          申請の内容
        </Typography>
        <Box component="dl" sx={{ m: 0 }}>
          <InfoRow label="種別">{actionLabel}</InfoRow>
          <InfoRow label="学年">{request.grade.display_name}</InfoRow>
          {/* 新設の申請には対象クラスが無い。承認後に削除されたクラスは null になる */}
          {request.action !== "creation" && (
            <InfoRow label="対象クラス">
              {request.school_class?.name ?? "削除済み"}
            </InfoRow>
          )}
          {/* 削除の申請には新しいクラス名が無い */}
          {request.action !== "deletion" && (
            <InfoRow label="新しいクラス名">{request.name}</InfoRow>
          )}
          <InfoRow label="申請者">{request.applicant.name}</InfoRow>
          <InfoRow label="申請日時">
            {formatDateTime(request.created_at)}
          </InfoRow>
        </Box>

        {(request.can_process || request.can_cancel) && (
          <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
            {request.can_process && (
              <>
                <Button
                  variant="contained"
                  onClick={() => setDialog("approve")}
                >
                  承認
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => openReasonDialog("reject")}
                >
                  却下
                </Button>
              </>
            )}
            {request.can_cancel && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => openReasonDialog("cancel")}
              >
                取り消す
              </Button>
            )}
          </Box>
        )}
      </Card>

      {request.status !== "pending" && (
        <Card elevation={0} sx={cardSx}>
          <Typography component="h2" sx={{ fontWeight: 700, mb: 1 }}>
            処理結果
          </Typography>
          <Box component="dl" sx={{ m: 0 }}>
            {request.status === "approved" && (
              <>
                <InfoRow label="処理者">
                  {request.approver?.name ?? "-"}
                </InfoRow>
                <InfoRow label="承認日時">
                  {formatDateTime(request.approved_at)}
                </InfoRow>
              </>
            )}
            {request.status === "rejected" && (
              <>
                <InfoRow label="処理者">
                  {request.approver?.name ?? "-"}
                </InfoRow>
                <InfoRow label="却下理由">{request.reason || "-"}</InfoRow>
              </>
            )}
            {request.status === "cancelled" && (
              <>
                <InfoRow label="取消日時">
                  {formatDateTime(request.cancelled_at)}
                </InfoRow>
                {/* 取消の理由は任意。却下も画面の外から理由なしで処理されうる */}
                <InfoRow label="取消理由">{request.reason || "-"}</InfoRow>
              </>
            )}
          </Box>
        </Card>
      )}

      <ApproveSchoolClassRequestDialog
        open={dialog === "approve"}
        onClose={closeDialog}
        onConfirm={onApprove}
        error={actionError}
      />
      <SchoolClassRequestReasonDialog
        open={dialog === "reject" || dialog === "cancel"}
        kind={reasonKind}
        onClose={closeDialog}
        onConfirm={reasonKind === "reject" ? onReject : onCancel}
        error={actionError}
      />
    </Box>
  );
};
