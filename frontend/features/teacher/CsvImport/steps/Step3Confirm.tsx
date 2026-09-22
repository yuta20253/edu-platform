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

type Props = {
  fileName: string;
  validCount: number;
  totalCount: number;
  submitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
};

export const Step3Confirm = ({
  fileName,
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
                ファイル
              </Typography>
              <Typography variant="body2">{fileName}</Typography>
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
