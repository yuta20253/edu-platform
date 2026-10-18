"use client";

import SendIcon from "@mui/icons-material/Send";
import { Alert, Box, Button, TextField } from "@mui/material";
import { useForm } from "react-hook-form";

// バックエンドの InterviewRequestMessage#body の上限と合わせる
const MESSAGE_MAX_LENGTH = 2000;

type Props = {
  // 成功時に true を返す。成功したときだけ入力欄を空にする
  onSend: (body: string) => Promise<boolean>;
  error: string;
};

type FormValues = { body: string };

export const MessageForm = ({ onSend, error }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { body: "" } });

  const submit = handleSubmit(async ({ body }) => {
    const succeeded = await onSend(body.trim());
    if (succeeded) reset();
  });

  return (
    <Box component="form" noValidate onSubmit={submit}>
      {error && (
        <Alert severity="error" sx={{ mb: 1.5, whiteSpace: "pre-line" }}>
          {error}
        </Alert>
      )}
      <TextField
        multiline
        minRows={2}
        fullWidth
        placeholder="メッセージを入力"
        slotProps={{ htmlInput: { "aria-label": "メッセージを入力" } }}
        {...register("body", {
          validate: (value) =>
            value.trim() !== "" || "メッセージを入力してください",
          maxLength: {
            value: MESSAGE_MAX_LENGTH,
            message: `メッセージは${MESSAGE_MAX_LENGTH}文字以内で入力してください`,
          },
        })}
        error={!!errors.body}
        helperText={errors.body?.message}
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Button
          type="submit"
          variant="contained"
          endIcon={<SendIcon />}
          disabled={isSubmitting}
        >
          送信
        </Button>
      </Box>
    </Box>
  );
};
