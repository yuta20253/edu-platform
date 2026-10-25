"use client";

import { colors } from "@/app/theme/colors";
import { MessageForm } from "@/components/interview/MessageForm";
import { MessageThread } from "@/components/interview/MessageThread";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  interviewReasonCategoryLabel,
  interviewStatusDefinitions,
} from "@/constants/interview_request";
import { isActiveInterviewStatus } from "@/libs/domain/interview/interviewStatus";
import {
  teacherInterviewActions,
  type TeacherInterviewActions,
} from "@/libs/domain/interview/teacherInterviewActions";
import { formatDateTime } from "@/libs/ui/formatDate";
import type {
  InterviewRequest,
  InterviewRequestMessage,
} from "@/types/interview/interviewRequest";
import {
  Alert,
  Box,
  Button,
  Card,
  Link as MuiLink,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CancelInterviewDialog } from "./components/CancelInterviewDialog";
import { CompleteInterviewDialog } from "./components/CompleteInterviewDialog";
import { ScheduleInterviewDialog } from "./components/ScheduleInterviewDialog";

type Props = {
  interview: InterviewRequest;
  messages: InterviewRequestMessage[];
  onSchedule: (scheduledAt: Date) => Promise<boolean>;
  onComplete: () => Promise<boolean>;
  onCancel: (reason: string) => Promise<boolean>;
  actionError: string;
  onClearActionError: () => void;
  onSendMessage: (body: string) => Promise<boolean>;
  sendError: string;
};

type OpenDialog = "schedule" | "complete" | "cancel" | null;
type CancelKind = NonNullable<TeacherInterviewActions["cancelKind"]>;

const initiatorLabel = { student: "生徒から", teacher: "教員から" } as const;

// 完了・キャンセル済みで入力欄の代わりに出す案内
const closedNotice: Partial<Record<InterviewRequest["status"], string>> = {
  completed: "この面談は完了しました",
  cancelled: "この面談はキャンセルされました",
};

const InfoRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <Box sx={{ display: "flex", gap: 2, py: 1 }}>
    <Typography
      sx={{ flex: "none", width: 112, fontSize: 13 }}
      color="text.secondary"
    >
      {label}
    </Typography>
    <Typography
      component="div"
      sx={{ fontSize: 14, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
    >
      {children}
    </Typography>
  </Box>
);

const cardSx = {
  border: `1px solid ${colors.border.light}`,
  borderRadius: 2,
} as const;

export const Presenter = ({
  interview,
  messages,
  onSchedule,
  onComplete,
  onCancel,
  actionError,
  onClearActionError,
  onSendMessage,
  sendError,
}: Props) => {
  const { canSchedule, canComplete, cancelKind } =
    teacherInterviewActions(interview);
  const isActive = isActiveInterviewStatus(interview.status);
  // 操作が 409/422 で失敗して面談を取り直し、その操作ができない状態に変わっても、
  // エラーを伝えられるようダイアログは開いたときの種類のまま残す
  const [dialog, setDialog] = useState<OpenDialog>(null);
  // 却下かキャンセルか。閉じるアニメーションの間に文言が切り替わらないよう、閉じても残す
  const [cancelDialogKind, setCancelDialogKind] =
    useState<CancelKind>("cancel");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 開いたとき・送受信でメッセージが増えたときは最新(一番下)を表示する
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const closeDialog = () => {
    setDialog(null);
    onClearActionError();
  };

  return (
    <Box sx={{ p: 3, width: "100%" }}>
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
          {interview.student_name}さんとの面談
        </Typography>
        <StatusBadge
          status={interview.status}
          definitions={interviewStatusDefinitions}
        />
        <Button
          component={Link}
          href="/teacher/interviews"
          variant="outlined"
          size="small"
          sx={{ ml: "auto", height: 32, px: 2, textTransform: "none" }}
        >
          一覧へ戻る
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 2fr) minmax(0, 3fr)",
          },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Card elevation={0} sx={{ ...cardSx, p: 3 }}>
          <Typography component="h2" sx={{ fontWeight: 700, mb: 1 }}>
            面談の内容
          </Typography>
          <InfoRow label="生徒">
            <MuiLink
              component={Link}
              href={`/teacher/students/${interview.student_id}`}
            >
              {interview.student_name}
            </MuiLink>
          </InfoRow>
          <InfoRow label="申請元">
            {initiatorLabel[interview.initiator_role]}
          </InfoRow>
          {/* 教員から申し込んだ面談には相談カテゴリが無い */}
          <InfoRow label="相談カテゴリ">
            {interview.reason_category
              ? interviewReasonCategoryLabel[interview.reason_category]
              : "-"}
          </InfoRow>
          <InfoRow label="相談内容">{interview.reason_detail}</InfoRow>
          <InfoRow label="申請日時">
            {formatDateTime(interview.created_at)}
          </InfoRow>
          {interview.scheduled_at && (
            <InfoRow label="予定日時">
              {formatDateTime(interview.scheduled_at)}
            </InfoRow>
          )}
          {interview.status === "completed" && (
            <InfoRow label="完了日時">
              {formatDateTime(interview.completed_at)}
            </InfoRow>
          )}
          {interview.status === "cancelled" && (
            <>
              <InfoRow label="キャンセル日時">
                {formatDateTime(interview.cancelled_at)}
              </InfoRow>
              {interview.cancel_reason && (
                <InfoRow label="キャンセル理由">
                  {interview.cancel_reason}
                </InfoRow>
              )}
            </>
          )}

          {isActive && (
            <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
              {canSchedule && (
                <Button
                  variant="contained"
                  onClick={() => setDialog("schedule")}
                >
                  日程を確定
                </Button>
              )}
              {canComplete && (
                <Button
                  variant="contained"
                  onClick={() => setDialog("complete")}
                >
                  完了にする
                </Button>
              )}
              {cancelKind && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setCancelDialogKind(cancelKind);
                    setDialog("cancel");
                  }}
                >
                  {cancelKind === "reject" ? "却下" : "キャンセル"}
                </Button>
              )}
            </Box>
          )}
        </Card>

        <Card
          elevation={0}
          sx={{ ...cardSx, display: "flex", flexDirection: "column" }}
        >
          <Typography
            component="h2"
            sx={{
              fontWeight: 700,
              px: 3,
              py: 2,
              borderBottom: `1px solid ${colors.border.light}`,
            }}
          >
            メッセージ
          </Typography>
          <Box
            ref={scrollRef}
            sx={{
              height: 420,
              overflowY: "auto",
              px: 2,
              py: 2,
              bgcolor: colors.accent[200],
            }}
          >
            <MessageThread
              messages={messages}
              currentUserId={interview.teacher_id}
            />
          </Box>
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderTop: `1px solid ${colors.border.light}`,
            }}
          >
            {/* 完了・キャンセル済みの面談ではやり取りを続けない */}
            {isActive ? (
              <MessageForm onSend={onSendMessage} error={sendError} />
            ) : (
              <>
                {/* 送信が 422 で失敗して面談が終了済みに切り替わったときも、理由が分かるよう残す */}
                {sendError && (
                  <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>
                    {sendError}
                  </Alert>
                )}
                <Typography
                  sx={{ py: 1, textAlign: "center", fontSize: 13 }}
                  color="text.secondary"
                >
                  {closedNotice[interview.status]}
                </Typography>
              </>
            )}
          </Box>
        </Card>
      </Box>

      <ScheduleInterviewDialog
        open={dialog === "schedule"}
        onClose={closeDialog}
        onConfirm={onSchedule}
        error={actionError}
      />
      <CompleteInterviewDialog
        open={dialog === "complete"}
        onClose={closeDialog}
        onConfirm={onComplete}
        error={actionError}
      />
      <CancelInterviewDialog
        open={dialog === "cancel"}
        kind={cancelDialogKind}
        onClose={closeDialog}
        onConfirm={onCancel}
        error={actionError}
      />
    </Box>
  );
};
