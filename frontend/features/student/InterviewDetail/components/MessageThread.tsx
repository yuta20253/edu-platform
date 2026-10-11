"use client";

import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { formatDateTime } from "@/libs/ui/formatDate";
import type { InterviewRequestMessage } from "@/types/interview/interviewRequest";
import { Box, Typography } from "@mui/material";

type Props = {
  messages: InterviewRequestMessage[];
  // 自分(生徒)のメッセージを右寄せにするための判定に使う
  currentUserId: number;
};

export const MessageThread = ({ messages, currentUserId }: Props) => {
  if (messages.length === 0) {
    return (
      <Typography
        sx={{ py: 4, textAlign: "center", fontSize: 13 }}
        color="text.secondary"
      >
        まだメッセージはありません
      </Typography>
    );
  }

  return (
    <Box
      component="ul"
      aria-label="メッセージ"
      sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1.5 }}
    >
      {messages.map((message) => {
        const isOwn = message.sender_id === currentUserId;
        return (
          <Box
            component="li"
            key={message.id}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: isOwn ? "flex-end" : "flex-start",
            }}
          >
            <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 0.5 }}>
              {isOwn ? "自分" : message.sender_name} ・{" "}
              {formatDateTime(message.created_at)}
            </Typography>
            <Box
              sx={{
                maxWidth: "85%",
                px: 1.5,
                py: 1,
                fontSize: 14,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                borderRadius: `${radius.md}px`,
                bgcolor: isOwn ? colors.accent[100] : colors.surface.white,
                border: `1px solid ${colors.border.light}`,
              }}
            >
              {message.body}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
