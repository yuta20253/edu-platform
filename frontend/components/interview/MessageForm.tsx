"use client";

import { colors } from "@/app/theme/colors";
import SendIcon from "@mui/icons-material/Send";
import { Alert, Box, IconButton, TextField } from "@mui/material";
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

  // 1行の入力欄と送信ボタンを横並びにする。Enter は改行にし、送信はボタンで行う(スマホのキーボードでも改行を入れられるようにするため)
  return (
    <Box component="form" noValidate onSubmit={submit}>
      {error && (
        <Alert severity="error" sx={{ mb: 1, whiteSpace: "pre-line" }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
        <TextField
          multiline
          minRows={1}
          maxRows={4}
          fullWidth
          size="small"
          placeholder="メッセージを入力"
          slotProps={{ htmlInput: { "aria-label": "メッセージを入力" } }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "20px",
              bgcolor: colors.surface.light,
            },
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
          }}
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
        <IconButton
          type="submit"
          aria-label="送信"
          color="primary"
          disabled={isSubmitting}
          sx={{ flex: "none", mb: errors.body ? 3 : 0 }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};
