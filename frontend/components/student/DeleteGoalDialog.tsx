"use client";

import { colors } from "@/app/theme/colors";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

type Props = {
  open: boolean;
  goalTitle: string;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
  error?: string | null;
};

export const DeleteGoalDialog = ({
  open,
  goalTitle,
  onClose,
  onConfirm,
  deleting,
  error,
}: Props) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>目標を削除しますか？</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <DialogContentText>
          「{goalTitle}」を削除すると元に戻せません。
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={deleting} color="inherit">
          キャンセル
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={deleting}
          sx={{ bgcolor: colors.status.error, "&:hover": { bgcolor: colors.status.error } }}
          startIcon={
            deleting ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          削除する
        </Button>
      </DialogActions>
    </Dialog>
  );
};
