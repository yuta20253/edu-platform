"use client";

import { colors } from "@/app/theme/colors";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  interviewReasonCategoryLabel,
  interviewStatusDefinitions,
  interviewStatuses,
} from "@/constants/interview_request";
import { formatDateTime } from "@/libs/ui/formatDate";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Card,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { InterviewsData, InterviewStatusFilter } from "./types";

type Props = {
  data: InterviewsData;
  page: number;
  onPageChange: (page: number) => void;
  status: InterviewStatusFilter;
  onStatusChange: (status: InterviewStatusFilter) => void;
};

const filters: { value: InterviewStatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  ...interviewStatuses.map((s) => ({
    value: s,
    label: interviewStatusDefinitions[s].label,
  })),
];

const initiatorLabel = { student: "生徒", teacher: "教員" } as const;

export const Presenter = ({
  data,
  page,
  onPageChange,
  status,
  onStatusChange,
}: Props) => {
  const { interview_requests: interviews, meta } = data;

  return (
    <Box sx={{ p: 3, width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Typography
          variant="h5"
          component="h1"
          fontWeight={700}
          sx={{ color: colors.text.primary }}
        >
          面談一覧
        </Typography>

        <Typography variant="body2" sx={{ color: colors.text.muted }}>
          {meta.total_count}件
        </Typography>

        <Button
          component={Link}
          href="/teacher/interviews/new"
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          sx={{ ml: "auto", textTransform: "none", fontWeight: 600 }}
        >
          面談を申請
        </Button>
      </Box>

      <ToggleButtonGroup
        exclusive
        size="small"
        value={status}
        onChange={(_, value: InterviewStatusFilter | null) => {
          if (value) onStatusChange(value);
        }}
        aria-label="ステータスで絞り込み"
        sx={{ mb: 2, flexWrap: "wrap" }}
      >
        {filters.map((f) => (
          <ToggleButton
            key={f.value}
            value={f.value}
            sx={{ px: 2, fontWeight: 600 }}
          >
            {f.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {interviews.length === 0 ? (
        <EmptyState message="面談はありません" />
      ) : (
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${colors.border.light}`,
            borderRadius: 2,
            overflow: "hidden",
            mb: 3,
          }}
        >
          <TableContainer>
            <Table
              size="small"
              sx={{
                minWidth: 760,
                "& th, & td": { py: 1.5, px: 2, verticalAlign: "middle" },
              }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: colors.surface.light,
                    "& th": { fontWeight: 700, color: colors.text.primary },
                  }}
                >
                  <TableCell>生徒</TableCell>
                  <TableCell>申請元</TableCell>
                  <TableCell>相談カテゴリ</TableCell>
                  <TableCell>予定日時</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell align="center">詳細</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {interviews.map((interview) => (
                  <TableRow
                    key={interview.id}
                    hover
                    sx={{ "&:last-child td": { borderBottom: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      {interview.student_name}
                    </TableCell>
                    <TableCell>
                      {initiatorLabel[interview.initiator_role]}
                    </TableCell>
                    {/* 教員から申し込んだ面談には相談カテゴリが無い */}
                    <TableCell>
                      {interview.reason_category
                        ? interviewReasonCategoryLabel[
                            interview.reason_category
                          ]
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(interview.scheduled_at)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={interview.status}
                        definitions={interviewStatusDefinitions}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        component={Link}
                        href={`/teacher/interviews/${interview.id}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          minWidth: 64,
                          height: 28,
                          fontSize: "0.75rem",
                          textTransform: "none",
                        }}
                      >
                        詳細
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {meta.total_pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={meta.total_pages}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
};
