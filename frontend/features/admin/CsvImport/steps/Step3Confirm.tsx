"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { colors } from "@/app/theme/colors";
import type { ImportMode } from "../types";

type Props = {
  courseLabel: string;
  unitName: string;
  fileName: string;
  mode: ImportMode;
  validCount: number;
  totalCount: number;
  submitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
};

const MODE_LABEL: Record<ImportMode, string> = {
  append: "追加",
  overwrite: "上書き",
};

export const Step3Confirm = ({
  courseLabel,
  unitName,
  fileName,
  mode,
  validCount,
  totalCount,
  submitting,
  submitError,
  onBack,
  onSubmit,
}: Props) => {
  return (
    <Box>
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: 2,
          mb: 2,
        }}
      >
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                講座
              </Typography>
              <Typography variant="body2">{courseLabel}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                単元
              </Typography>
              <Typography variant="body2">{unitName}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                ファイル
              </Typography>
              <Typography variant="body2">{fileName}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                モード
              </Typography>
              <Typography variant="body2">{MODE_LABEL[mode]}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                有効行数
              </Typography>
              <Typography variant="body2">
                {validCount} / {totalCount}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {mode === "overwrite" && (
        <Alert severity="error" sx={{ mb: 2 }}>
          この操作は取り消せません。既存の問題は全て削除され、CSVの内容で置き換わります。
        </Alert>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button onClick={onBack} disabled={submitting}>
          戻る
        </Button>
        <Button
          variant="contained"
          disabled={submitting}
          onClick={onSubmit}
          startIcon={
            submitting ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          インポートを実行
        </Button>
      </Box>
    </Box>
  );
};
