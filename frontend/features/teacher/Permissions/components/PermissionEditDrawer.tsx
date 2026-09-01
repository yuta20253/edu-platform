"use client";

import { colors } from "@/app/theme/colors";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { Controller, UseFormReturn } from "react-hook-form";
import type { PermissionTeacher, UpdatePermissionInput } from "../types";

type Props = {
  teacher: PermissionTeacher | null;
  onClose: () => void;
  onUpdate: (input: UpdatePermissionInput) => void;
  updating: boolean;
  updateErrors: string[];
  form: UseFormReturn<UpdatePermissionInput>;
};

export const PermissionEditDrawer = ({
  teacher,
  onClose,
  onUpdate,
  updating,
  updateErrors,
  form,
}: Props) => {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  return (
    <Drawer
      anchor="right"
      open={teacher !== null}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 480, maxWidth: "100%" } } }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(onUpdate)}
        sx={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
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

        <Box sx={{ p: 3, flex: 1, overflow: "auto" }}>
          {updateErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Stack component="ul" sx={{ m: 0, pl: 2 }} spacing={0.5}>
                {updateErrors.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </Stack>
            </Alert>
          )}
          <Stack spacing={3}>
            <Controller
              name="grade_scope"
              control={control}
              rules={{ required: "操作範囲を選択してください" }}
              render={({ field }) => (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    操作範囲
                  </Typography>
                  <RadioGroup row {...field} value={field.value}>
                    <FormControlLabel
                      value="own_grade"
                      control={<Radio />}
                      label="自学年"
                    />
                    <FormControlLabel
                      value="all_grades"
                      control={<Radio />}
                      label="全学年"
                    />
                  </RadioGroup>
                  {errors.grade_scope && (
                    <FormHelperText error>
                      {errors.grade_scope.message}
                    </FormHelperText>
                  )}
                </Box>
              )}
            />

            <Controller
              name="manage_other_teachers"
              control={control}
              render={({ field }) => (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    他の教員操作権限
                  </Typography>

                  <RadioGroup
                    row
                    value={field.value ? "1" : "0"}
                    onChange={(event) =>
                      field.onChange(event.target.value === "1")
                    }
                  >
                    <FormControlLabel
                      value="0"
                      control={<Radio />}
                      label="無"
                    />
                    <FormControlLabel
                      value="1"
                      control={<Radio />}
                      label="有"
                    />
                  </RadioGroup>
                </Box>
              )}
            />
          </Stack>
        </Box>

        <Box
          sx={{
            p: 3,
            borderTop: `1px solid ${colors.border.light}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
          }}
        >
          <Button onClick={onClose} disabled={updating} color="inherit">
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={updating}
            startIcon={
              updating ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            保存
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
