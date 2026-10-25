"use client";

import { colors } from "@/app/theme/colors";
import type { InterviewRequestMessage } from "@/types/interview/interviewRequest";
import { Box, Typography } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { format, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";

type Props = {
  messages: InterviewRequestMessage[];
  // 自分(閲覧しているユーザー)のメッセージを右寄せにするための判定に使う
  currentUserId: number;
};

// 自分は右・相手は左の吹き出しで並べ、日付が変わるところに区切りを入れる
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
      sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1 }}
    >
      {messages.map((message, i) => {
        const prev = messages[i - 1];
        const createdAt = new Date(message.created_at);
        const isNewDay =
          !prev || !isSameDay(new Date(prev.created_at), createdAt);
        const isOwn = message.sender_id === currentUserId;
        // 相手の名前は、同じ人の連続したメッセージでは先頭にだけ出す
        const showSenderName =
          !isOwn && (isNewDay || prev.sender_id !== message.sender_id);

        return (
          <Box component="li" key={message.id}>
            {isNewDay && (
              <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
                <Box
                  component="span"
                  sx={{
                    px: 1.5,
                    py: 0.25,
                    fontSize: 11,
                    borderRadius: 999,
                    color: colors.text.inverse,
                    bgcolor: "rgba(15, 23, 42, 0.25)",
                  }}
                >
                  {format(createdAt, "M月d日(E)", { locale: ja })}
                </Box>
              </Box>
            )}
            {showSenderName && (
              <Typography
                sx={{ fontSize: 11, color: "text.secondary", mb: 0.5, ml: 0.5 }}
              >
                {message.sender_name}
              </Typography>
            )}
            <Box
              sx={{
                display: "flex",
                flexDirection: isOwn ? "row-reverse" : "row",
                alignItems: "flex-end",
                gap: 0.75,
              }}
            >
              {/* 画面上は左右の位置で送信者を表すため、読み上げ用にだけ送信者を添える */}
              {isOwn && <Box sx={visuallyHidden}>自分</Box>}
              {!isOwn && !showSenderName && (
                <Box sx={visuallyHidden}>{message.sender_name}</Box>
              )}
              <Box
                sx={{
                  maxWidth: "75%",
                  px: 1.5,
                  py: 1,
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  borderRadius: "18px",
                  ...(isOwn
                    ? {
                        bgcolor: colors.accent[600],
                        color: colors.text.inverse,
                        borderBottomRightRadius: "4px",
                      }
                    : {
                        bgcolor: colors.surface.white,
                        borderBottomLeftRadius: "4px",
                      }),
                }}
              >
                {message.body}
              </Box>
              <Typography
                component="time"
                dateTime={message.created_at}
                sx={{ flex: "none", fontSize: 10, color: "text.secondary" }}
              >
                {format(createdAt, "HH:mm")}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
