"use client";

import { colors } from "@/app/theme/colors";
import { cardSx } from "@/app/theme/studentTheme";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  INTERVIEW_REASON_CATEGORY_LABELS,
  INTERVIEW_STATUS_DEFINITIONS,
  isActiveInterviewStatus,
} from "@/libs/domain/interview/interviewRequest";
import { formatDateTime } from "@/libs/ui/formatDate";
import type {
  InterviewRequest,
  InterviewRequestMessage,
} from "@/types/interview/interviewRequest";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import { CancelInterviewDialog } from "./components/CancelInterviewDialog";
import { MessageForm } from "./components/MessageForm";
import { MessageThread } from "./components/MessageThread";

type Props = {
  interview: InterviewRequest;
  messages: InterviewRequestMessage[];
  onSendMessage: (body: string) => Promise<boolean>;
  sendError: string;
  onCancel: (reason: string) => Promise<boolean>;
  cancelError: string;
  onClearCancelError: () => void;
};

const sectionTitleSx = { fontSize: 15, fontWeight: 800, mb: 1.5 } as const;

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ display: "flex", gap: 2, py: 1 }}>
    <Typography
      sx={{ flex: "none", width: 96, fontSize: 13 }}
      color="text.secondary"
    >
      {label}
    </Typography>
    <Typography
      sx={{ fontSize: 14, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
    >
      {value}
    </Typography>
  </Box>
);

export const Presenter = ({
  interview,
  messages,
  onSendMessage,
  sendError,
  onCancel,
  cancelError,
  onClearCancelError,
}: Props) => {
  const [cancelOpen, setCancelOpen] = useState(false);
  const isActive = isActiveInterviewStatus(interview.status);

  const closeCancelDialog = () => {
    setCancelOpen(false);
    onClearCancelError();
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Button
        component={Link}
        href="/interviews"
        startIcon={<ChevronLeftIcon />}
        size="small"
        sx={{ ml: -1 }}
      >
        面談一覧へ
      </Button>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          mt: 1,
          mb: 2,
        }}
      >
        <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
          {interview.teacher_name}との面談
        </Typography>
        <Box sx={{ flex: "none" }}>
          <StatusBadge
            status={interview.status}
            definitions={INTERVIEW_STATUS_DEFINITIONS}
          />
        </Box>
      </Box>

      <Box sx={{ ...cardSx, p: 2.5 }}>
        <InfoRow
          label="相談カテゴリ"
          value={
            interview.reason_category
              ? INTERVIEW_REASON_CATEGORY_LABELS[interview.reason_category]
              : "先生から"
          }
        />
        <InfoRow label="相談内容" value={interview.reason_detail} />
        {interview.scheduled_at && (
          <InfoRow
            label="予定日時"
            value={formatDateTime(interview.scheduled_at)}
          />
        )}
        {interview.status === "cancelled" && interview.cancel_reason && (
          <InfoRow label="キャンセル理由" value={interview.cancel_reason} />
        )}
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography component="h2" sx={sectionTitleSx}>
          メッセージ
        </Typography>
        <Box
          sx={{
            p: 2,
            bgcolor: colors.surface.light,
            borderRadius: cardSx.borderRadius,
          }}
        >
          <MessageThread
            messages={messages}
            currentUserId={interview.student_id}
          />
        </Box>
        {/* 完了・キャンセル済みの面談ではやり取りを続けない */}
        {isActive && (
          <Box sx={{ mt: 2 }}>
            <MessageForm onSend={onSendMessage} error={sendError} />
          </Box>
        )}
      </Box>

      {isActive && (
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Button color="error" onClick={() => setCancelOpen(true)}>
            面談をキャンセル
          </Button>
          <CancelInterviewDialog
            open={cancelOpen}
            onClose={closeCancelDialog}
            onConfirm={onCancel}
            error={cancelError}
          />
        </Box>
      )}
    </Box>
  );
};
