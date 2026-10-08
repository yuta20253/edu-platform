"use client";

import { Alert, Box, Button, Typography } from "@mui/material";
import { AccountLinkPreview } from "./types";

type Props = {
  preview: AccountLinkPreview;
  errorMessage: string;
  onConfirm: () => void;
  onBack: () => void;
  disabled: boolean;
};

const buildConfirmMessage = (preview: AccountLinkPreview): string => {
  const parts = [preview.high_school_name, preview.grade_display_name];

  if (preview.school_class_name) {
    parts.push(preview.school_class_name);
  }

  return `${parts.filter(Boolean).join(" ")} に紐付けます。よろしいですか?`;
};

export const ConfirmPresenter = ({
  preview,
  errorMessage,
  onConfirm,
  onBack,
  disabled,
}: Props): React.JSX.Element => {
  return (
    <Box sx={{ maxWidth: 480, mx: "auto" }}>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
        アカウント紐付け
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        内容をご確認ください。
      </Typography>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Typography sx={{ mb: 3 }}>{buildConfirmMessage(preview)}</Typography>

      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={onBack}
          disabled={disabled}
        >
          戻る
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={onConfirm}
          disabled={disabled}
        >
          はい、紐付ける
        </Button>
      </Box>
    </Box>
  );
};
