"use client";

import { colors } from "@/app/theme/colors";
import { Alert, Box, Drawer, Stack, Typography } from "@mui/material";
import type { PermissionTeacher, UpdatePermissionPayload } from "../types";
import { PermissionEditForm } from "./PermissionEditForm";

type Props = {
  teacher: PermissionTeacher | null;
  // 中身(PermissionEditForm)の key。変わるたびに作り直して、最新の権限を取り直す
  formKey: number;
  onClose: () => void;
  onUpdate: (payload: UpdatePermissionPayload) => void;
  updating: boolean;
  updateErrors: string[];
};

export const PermissionEditDrawer = ({
  teacher,
  formKey,
  onClose,
  onUpdate,
  updating,
  updateErrors,
}: Props) => {
  return (
    <Drawer
      anchor="right"
      open={teacher !== null}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 480, maxWidth: "100%" } } }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            p: 3,
            borderBottom: `1px solid ${colors.border.light}`,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            権限を編集
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: colors.text.muted, mt: 0.5 }}
          >
            {teacher?.name}
          </Typography>
        </Box>

        {/* フォームを作り直しても消えないよう、エラーはフォームの外に出す */}
        {updateErrors.length > 0 && (
          <Alert severity="error" sx={{ mx: 3, mt: 3 }}>
            <Stack component="ul" sx={{ m: 0, pl: 2 }} spacing={0.5}>
              {updateErrors.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </Stack>
          </Alert>
        )}

        {teacher && (
          <PermissionEditForm
            // 409 のときはドロワーが開いたまま(teacher も同じ)なので、
            // key を変えないと作り直されず、最新の権限を取り直せない
            key={formKey}
            teacherId={teacher.id}
            onSubmit={onUpdate}
            onCancel={onClose}
            updating={updating}
          />
        )}
      </Box>
    </Drawer>
  );
};
