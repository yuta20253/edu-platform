"use client";

import {
  Alert,
  Box,
  Button,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { AccountLinkForm } from "./types";

type Toast = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

type Props = {
  register: UseFormRegister<AccountLinkForm>;
  errors: FieldErrors<AccountLinkForm>;
  errorMessage: string;
  onSubmit: () => void;
  toast: Toast;
  closeToast: () => void;
};

export const Presenter = ({
  register,
  errors,
  errorMessage,
  onSubmit,
  toast,
  closeToast,
}: Props): React.JSX.Element => {
  return (
    <Box sx={{ maxWidth: 480, mx: "auto" }}>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
        アカウント紐付け
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        学校から配布された生徒コードを入力してください。
      </Typography>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={onSubmit}
        noValidate
        sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
            生徒コード
          </Typography>
          <TextField
            fullWidth
            placeholder="生徒コードを入力してください"
            {...register("student_number", {
              required: "生徒コードを入力してください",
            })}
            error={!!errors.student_number}
            helperText={errors.student_number?.message}
          />
        </Box>
        <Button type="submit" variant="contained" fullWidth>
          紐付ける
        </Button>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={closeToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={closeToast}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
