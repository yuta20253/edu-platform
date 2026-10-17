"use client";

import { colors } from "@/app/theme/colors";
import { Box, Chip, Typography } from "@mui/material";
import type { Status } from "@/types/common/status";
import { isOverdue } from "./dueDate";

type Props = {
  dueDate: string | null;
  status: Status;
};

// 期限の表示。未完了で期限を過ぎていれば赤字にして「期限切れ」を添える
export const DueDateLabel = ({ dueDate, status }: Props) => {
  const overdue = isOverdue(dueDate, status);

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
      <Typography
        variant="caption"
        fontWeight={overdue ? 600 : 400}
        sx={{ color: overdue ? colors.status.error : colors.text.muted }}
      >
        {dueDate ? `期限: ${dueDate}` : "期限なし"}
      </Typography>
      {overdue && (
        <Chip
          label="期限切れ"
          size="small"
          color="error"
          variant="outlined"
          sx={{ height: 20, fontSize: 11 }}
        />
      )}
    </Box>
  );
};
