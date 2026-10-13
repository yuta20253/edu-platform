"use client";

import { colors } from "@/app/theme/colors";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { priorityDefinitions } from "@/constants/priority";
import { statusDefinitions } from "@/constants/status";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  type ChipProps,
  LinearProgress,
  Typography,
} from "@mui/material";
import { StudentTask } from "../types";
import { CorrectRateBadge } from "./CorrectRateBadge";
import { DueDateLabel } from "./DueDateLabel";
import { TaskUnitList } from "./TaskUnitList";

type Props = {
  tasks: StudentTask[];
  totalCount: number;
};

const MetricLabel = ({ children }: { children: string }) => (
  <Typography
    variant="caption"
    sx={{ display: "block", color: colors.text.secondary, mb: 0.25 }}
  >
    {children}
  </Typography>
);

export const TasksTab = ({ tasks, totalCount }: Props) => {
  if (tasks.length === 0) {
    return (
      <Typography
        variant="body2"
        sx={{ py: 6, textAlign: "center", color: colors.text.secondary }}
      >
        タスクがありません
      </Typography>
    );
  }

  return (
    <Box>
      <Typography
        variant="body2"
        sx={{ mb: 1.5, textAlign: "right", color: colors.text.muted }}
      >
        全{totalCount}件
      </Typography>

      {tasks.map((task) => {
        const priority = priorityDefinitions[task.priority];

        return (
          <Accordion
            key={task.id}
            disableGutters
            elevation={0}
            // 閉じているタスクのUnitは描画しない(一覧が長いときに要素を増やさない)
            slotProps={{ transition: { unmountOnExit: true } }}
            sx={{
              border: `1px solid ${colors.border.light}`,
              borderLeft: `4px solid ${colors.statusUi[task.status].text}`,
              "&:not(:last-of-type)": { borderBottom: 0 },
              "&::before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ px: 2.5, "& .MuiAccordionSummary-content": { my: 2 } }}
            >
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  pr: 1,
                  flexWrap: { xs: "wrap", md: "nowrap" },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <StatusBadge
                      status={task.status}
                      definitions={statusDefinitions}
                    />
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {task.title}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      columnGap: 2,
                      rowGap: 0.5,
                      mt: 0.75,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: colors.text.secondary }}
                    >
                      目標: {task.goal.title}
                    </Typography>
                    <Chip
                      label={`優先度: ${priority.label}`}
                      size="small"
                      variant="outlined"
                      color={priority.color as ChipProps["color"]}
                      sx={{ height: 22, fontSize: 11 }}
                    />
                    <DueDateLabel
                      dueDate={task.due_date}
                      status={task.status}
                    />
                  </Box>
                </Box>

                <Box sx={{ width: 140, flexShrink: 0 }}>
                  <MetricLabel>進捗</MetricLabel>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ lineHeight: 1.3 }}
                  >
                    {task.progress.progress_rate}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={task.progress.progress_rate}
                    aria-label={`${task.title}の進捗`}
                    sx={{ mt: 0.5, height: 6, borderRadius: 999 }}
                  />
                </Box>

                <Box sx={{ width: 88, flexShrink: 0, textAlign: "center" }}>
                  <MetricLabel>正答率</MetricLabel>
                  <CorrectRateBadge rate={task.progress.correct_rate} />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                borderTop: `1px solid ${colors.border.light}`,
                bgcolor: colors.surface.default,
                p: 2.5,
              }}
            >
              <TaskUnitList units={task.units} />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};
