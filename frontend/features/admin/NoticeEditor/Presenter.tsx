"use client";

import { colors } from "@/app/theme/colors";
import type { AdminNoticeDetail } from "@/types/announcement/admin-notice";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { DeliverySidebar } from "./components/DeliverySidebar";
import type { NoticeFormValues } from "./types";

const TITLE_MAX_LENGTH = 255;
const CONTENT_MAX_LENGTH = 10_000;

type Props = {
  notice: AdminNoticeDetail | null;
  submitting: boolean;
  submitError: string | null;
  onSaveDraft: (values: NoticeFormValues) => void;
  onDeliver: (values: NoticeFormValues) => void;
};

const buildDefaultValues = (
  notice: AdminNoticeDetail | null,
): NoticeFormValues => ({
  title: notice?.title ?? "",
  content: notice?.content ?? "",
  deliveryTiming: notice?.status === "scheduled" ? "scheduled" : "draft",
  scheduledAt: notice?.scheduled_at ? new Date(notice.scheduled_at) : null,
});

export const Presenter = ({
  notice,
  submitting,
  submitError,
  onSaveDraft,
  onDeliver,
}: Props) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<NoticeFormValues>({
    defaultValues: buildDefaultValues(notice),
  });

  const content = watch("content");
  const deliveryTiming = watch("deliveryTiming");

  // scheduledAtの必須・未来日時チェックは「配信する」で予約配信を選んだ場合のみ行う。
  // Controllerのrulesにすると「下書き保存」の送信時にも走ってしまい、
  // 予約配信を選んだだけで下書き保存がブロックされてしまうため、ここで個別に検証する。
  const handleDeliver = handleSubmit((values) => {
    if (values.deliveryTiming === "scheduled") {
      if (!values.scheduledAt) {
        setError("scheduledAt", { message: "配信日時を指定してください" });
        return;
      }
      if (values.scheduledAt.getTime() <= Date.now()) {
        setError("scheduledAt", { message: "未来の日時を指定してください" });
        return;
      }
    }

    onDeliver(values);
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ color: colors.text.primary, mb: 3 }}
      >
        {notice ? "お知らせを編集" : "お知らせを作成"}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          gap: 3,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <Stack spacing={3} sx={{ flex: "2 1 480px" }}>
          <Card
            elevation={0}
            sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
          >
            <CardContent>
              <Stack spacing={3}>
                <TextField
                  label="タイトル"
                  fullWidth
                  required
                  {...register("title", {
                    required: "タイトルを入力してください",
                    maxLength: {
                      value: TITLE_MAX_LENGTH,
                      message: `タイトルは${TITLE_MAX_LENGTH}文字以内で入力してください`,
                    },
                  })}
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
                <TextField
                  label="本文"
                  fullWidth
                  required
                  multiline
                  minRows={10}
                  {...register("content", {
                    required: "本文を入力してください",
                    maxLength: {
                      value: CONTENT_MAX_LENGTH,
                      message: `本文は${CONTENT_MAX_LENGTH}文字以内で入力してください`,
                    },
                  })}
                  error={!!errors.content}
                  helperText={errors.content?.message}
                />
              </Stack>
            </CardContent>
          </Card>

          <Card
            elevation={0}
            sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                プレビュー
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {/* contentはJSXのテキスト子として描画されるためReactが自動でHTMLエスケープする */}
              <Typography
                component="div"
                data-testid="notice-preview"
                sx={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: content ? colors.text.primary : colors.text.muted,
                }}
              >
                {content || "本文のプレビューがここに表示されます"}
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        <Box sx={{ flex: "1 1 280px" }}>
          <DeliverySidebar control={control} deliveryTiming={deliveryTiming} />
        </Box>
      </Box>

      <Box
        sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}
      >
        <Button
          component={Link}
          href="/admin/notices"
          color="inherit"
          disabled={submitting}
        >
          キャンセル
        </Button>
        <Button
          variant="outlined"
          disabled={submitting}
          onClick={handleSubmit((values) => onSaveDraft(values))}
        >
          下書き保存
        </Button>
        <Button
          variant="contained"
          disabled={submitting || deliveryTiming === "draft"}
          startIcon={
            submitting ? <CircularProgress size={16} color="inherit" /> : null
          }
          onClick={handleDeliver}
        >
          配信する
        </Button>
      </Box>
    </Box>
  );
};
