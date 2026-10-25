"use client";

import { colors } from "@/app/theme/colors";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  interviewReasonCategoryLabel,
  interviewStatusDefinitions,
} from "@/constants/interview_request";
import { isActiveInterviewStatus } from "@/libs/domain/interview/interviewStatus";
import { formatDateTime } from "@/libs/ui/formatDate";
import type {
  InterviewRequest,
  InterviewRequestMessage,
} from "@/types/interview/interviewRequest";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Alert,
  Box,
  ButtonBase,
  Collapse,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CancelInterviewDialog } from "./components/CancelInterviewDialog";
import { MessageForm } from "@/components/interview/MessageForm";
import { MessageThread } from "@/components/interview/MessageThread";

type Props = {
  interview: InterviewRequest;
  messages: InterviewRequestMessage[];
  onSendMessage: (body: string) => Promise<boolean>;
  sendError: string;
  onCancel: (reason: string) => Promise<boolean>;
  cancelError: string;
  onClearCancelError: () => void;
};

// この距離以内なら「一番下を見ている」とみなす
const BOTTOM_THRESHOLD_PX = 40;

// 完了・キャンセル済みで入力バーの代わりに出す案内
const closedNotice: Partial<Record<InterviewRequest["status"], string>> = {
  completed: "この面談は完了しました",
  cancelled: "この面談はキャンセルされました",
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ display: "flex", gap: 2, py: 0.75 }}>
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
  const isActive = isActiveInterviewStatus(interview.status);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  // 入力バーが無い(完了・キャンセル済み)ときは、キャンセル理由などが見えるよう最初から開いておく
  const [detailOpen, setDetailOpen] = useState(!isActive);
  const scrollRef = useRef<HTMLDivElement>(null);
  // 一番下(最新)を見ているか。過去のメッセージを読んでいる最中は勝手にスクロールさせない
  const atBottomRef = useRef(true);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // 開いたとき・送受信でメッセージが増えたときは最新(一番下)を表示する
  useLayoutEffect(() => {
    scrollToBottom();
    atBottomRef.current = true;
  }, [messages]);

  // 面談の内容を開く・入力欄が複数行に伸びる・キーボードが出る等でメッセージ欄が縮んでも、最新が隠れないよう追従する
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (atBottomRef.current) scrollToBottom();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD_PX;
  };

  const openCancelDialog = () => {
    setMenuAnchor(null);
    setCancelOpen(true);
  };

  const closeCancelDialog = () => {
    setCancelOpen(false);
    onClearCancelError();
  };

  return (
    // メッセージ欄だけをスクロールさせ、ヘッダーと入力バーを常に表示するため画面全体に固定する
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        display: "flex",
        flexDirection: "column",
        maxWidth: 600,
        mx: "auto",
        bgcolor: colors.surface.white,
      }}
    >
      <Box
        component="header"
        sx={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 0.5,
          py: 0.75,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        <IconButton component={Link} href="/interviews" aria-label="面談一覧へ">
          <ChevronLeftIcon />
        </IconButton>
        <Typography
          variant="h6"
          component="h1"
          noWrap
          sx={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 800 }}
        >
          {interview.teacher_name}との面談
        </Typography>
        <Box sx={{ flex: "none" }}>
          <StatusBadge
            status={interview.status}
            definitions={interviewStatusDefinitions}
          />
        </Box>
        {isActive ? (
          <IconButton
            aria-label="メニュー"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            <MoreVertIcon />
          </IconButton>
        ) : (
          // メニューの有無でタイトル位置がずれないよう幅を揃える
          <Box sx={{ width: 40, flex: "none" }} />
        )}
        <Menu
          anchorEl={menuAnchor}
          open={!!menuAnchor}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={openCancelDialog} sx={{ color: "error.main" }}>
            面談をキャンセル
          </MenuItem>
        </Menu>
      </Box>

      {/* 面談の内容はヘッダー下に畳んで置く */}
      <Box
        sx={{
          flex: "none",
          borderBottom: `1px solid ${colors.border.light}`,
          bgcolor: colors.surface.default,
        }}
      >
        <ButtonBase
          onClick={() => setDetailOpen((open) => !open)}
          aria-expanded={detailOpen}
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            gap: 1,
            px: 2,
            py: 1,
            fontSize: 13,
            textAlign: "left",
          }}
        >
          <Box component="span" sx={{ minWidth: 0 }}>
            {interview.scheduled_at ? (
              <>
                <Box component="span" sx={{ color: "text.secondary", mr: 1 }}>
                  予定日時
                </Box>
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {formatDateTime(interview.scheduled_at)}
                </Box>
              </>
            ) : (
              "面談の内容"
            )}
          </Box>
          <ExpandMoreIcon
            fontSize="small"
            sx={{
              color: "text.secondary",
              transform: detailOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </ButtonBase>
        <Collapse in={detailOpen}>
          <Box sx={{ px: 2, pb: 1.5, maxHeight: "40dvh", overflowY: "auto" }}>
            <InfoRow
              label="相談カテゴリ"
              value={
                interview.reason_category
                  ? interviewReasonCategoryLabel[interview.reason_category]
                  : "先生から"
              }
            />
            <InfoRow label="相談内容" value={interview.reason_detail} />
            {interview.status === "cancelled" && interview.cancel_reason && (
              <InfoRow label="キャンセル理由" value={interview.cancel_reason} />
            )}
          </Box>
        </Collapse>
      </Box>

      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 1.5,
          py: 2,
          bgcolor: colors.accent[200],
        }}
      >
        <MessageThread
          messages={messages}
          currentUserId={interview.student_id}
        />
      </Box>

      <Box
        sx={{
          flex: "none",
          px: 1.5,
          pt: 1,
          pb: "calc(8px + env(safe-area-inset-bottom))",
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

      {/* キャンセルが 422 で失敗して面談が終了済みに切り替わっても、エラーを伝えられるようダイアログは状態によらず置いておく */}
      <CancelInterviewDialog
        open={cancelOpen}
        onClose={closeCancelDialog}
        onConfirm={onCancel}
        error={cancelError}
      />
    </Box>
  );
};
