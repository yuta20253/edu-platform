"use client";

import { colors } from "@/app/theme/colors";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  interviewReasonCategoryLabel,
  interviewStatusDefinitions,
} from "@/constants/interview_request";
import { formatDateTime } from "@/libs/ui/formatDate";
import type { InterviewRequest } from "@/types/interview/interviewRequest";
import { Box, Typography } from "@mui/material";
import Link from "next/link";

// 教員から申し込まれた面談には相談カテゴリが無い
const categoryLabel = (interview: InterviewRequest) =>
  interview.reason_category
    ? interviewReasonCategoryLabel[interview.reason_category]
    : "先生から";

type Props = {
  interview: InterviewRequest;
};

export const InterviewRow = ({ interview }: Props) => (
  <Box
    component={Link}
    href={`/interviews/${interview.id}`}
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 1.25,
      py: 1.75,
      borderBottom: `1px solid ${colors.border.light}`,
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
        {interview.teacher_name}
      </Typography>
      <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.5 }}>
        <span>{categoryLabel(interview)}</span>
        {interview.scheduled_at && (
          <span> ・ 予定 {formatDateTime(interview.scheduled_at)}</span>
        )}
      </Typography>
    </Box>
    <Box sx={{ flex: "none" }}>
      <StatusBadge
        status={interview.status}
        definitions={interviewStatusDefinitions}
      />
    </Box>
  </Box>
);
