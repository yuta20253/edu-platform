"use client";

import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  interviewStatusDefinitions,
  interviewStatuses,
} from "@/constants/interview_request";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { InterviewRow } from "./components/InterviewRow";
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

export const Presenter = ({
  data,
  page,
  onPageChange,
  status,
  onStatusChange,
}: Props) => {
  const { interview_requests: interviews, meta } = data;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 1,
          mb: 2,
        }}
      >
        <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
          面談
        </Typography>
        <Button
          component={Link}
          href="/interviews/new"
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
        >
          面談を申請
        </Button>
      </Box>

      {/* スマホ幅で6つの絞り込みが収まらないため横スクロールさせる */}
      <Box sx={{ overflowX: "auto" }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={status}
          onChange={(_, value: InterviewStatusFilter | null) => {
            if (value) onStatusChange(value);
          }}
          aria-label="ステータスで絞り込み"
          sx={{
            bgcolor: colors.surface.light,
            borderRadius: `${radius.sm}px`,
            p: 0.5,
            gap: 0.5,
            "& .MuiToggleButtonGroup-grouped": {
              border: 0,
              borderRadius: `${radius.sm - 2}px !important`,
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
              color: "text.secondary",
              "&.Mui-selected, &.Mui-selected:hover": {
                bgcolor: colors.surface.white,
                color: "primary.main",
                boxShadow: `0 1px 3px ${colors.shadow.footer}`,
              },
            },
          }}
        >
          {filters.map((f) => (
            <ToggleButton key={f.value} value={f.value}>
              {f.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ mt: 1 }}>
        {interviews.length === 0 ? (
          <EmptyState message="面談はありません" />
        ) : (
          interviews.map((interview) => (
            <InterviewRow key={interview.id} interview={interview} />
          ))
        )}
      </Box>

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
