"use client";

import { colors } from "@/app/theme/colors";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { priorityLabel } from "@/constants/priority";
import { statusDefinitions } from "@/constants/status";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  LinearProgress,
  Typography,
} from "@mui/material";
import { StudentTask } from "../types";
import { formatCorrectRate, getCorrectRateColor } from "./correctRate";
import { TaskUnitList } from "./TaskUnitList";

type Props = {
  tasks: StudentTask[];
};

export const TasksTab = ({ tasks }: Props) => {
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
      {tasks.map((task) => (
        <Accordion
          key={task.id}
          disableGutters
          elevation={0}
          // 閉じているタスクのUnitは描画しない(一覧が長いときに要素を増やさない)
          slotProps={{ transition: { unmountOnExit: true } }}
          sx={{
            border: `1px solid ${colors.border.light}`,
            "&:not(:last-of-type)": { borderBottom: 0 },
            "&::before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ width: "100%", pr: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  {task.title}
                </Typography>
                <StatusBadge
                  status={task.status}
                  definitions={statusDefinitions}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  columnGap: 2,
                  mt: 0.5,
                  color: colors.text.muted,
                }}
              >
                <Typography variant="caption">
                  目標: {task.goal.title}
                </Typography>
                <Typography variant="caption">
                  優先度: {priorityLabel[task.priority]}
                </Typography>
                <Typography variant="caption">
                  {task.due_date ? `期限: ${task.due_date}` : "期限なし"}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mt: 1.5,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    進捗 {task.progress.progress_rate}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={task.progress.progress_rate}
                    aria-label={`${task.title}の進捗`}
                    sx={{ height: 6, borderRadius: 999 }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    whiteSpace: "nowrap",
                    color: getCorrectRateColor(task.progress.correct_rate),
                  }}
                >
                  正答率 {formatCorrectRate(task.progress.correct_rate)}
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails
            sx={{ borderTop: `1px solid ${colors.border.light}`, pt: 2 }}
          >
            <TaskUnitList units={task.units} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};
