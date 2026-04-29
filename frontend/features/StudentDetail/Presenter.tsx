"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { Student } from "./types";

type Props = {
  student: Student;
};

export const Presenter = ({ student }: Props) => {
  const genderLabel =
    student.user_personal_info.gender === "male"
      ? "男性"
      : student.user_personal_info.gender === "female"
        ? "女性"
        : "未設定";

  const addressText = `${student.address.prefecture.name}${student.address.city}${student.address.town}`;

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: colors.text.primary }}
        >
          生徒詳細
        </Typography>

        <Button
          component={Link}
          href="/teacher/students"
          variant="outlined"
          size="small"
          sx={{
            height: 32,
            px: 2,
            textTransform: "none",
          }}
        >
          一覧へ戻る
        </Button>
      </Box>

      <Card
        elevation={0}
        sx={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: 2,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 0.5,
                  color: colors.text.muted,
                }}
              >
                氏名
              </Typography>

              <Typography variant="body1" fontWeight={600}>
                {student.name}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 0.5,
                  color: colors.text.muted,
                }}
              >
                氏名カナ
              </Typography>

              <Typography variant="body1">{student.name_kana}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 0.5,
                  color: colors.text.muted,
                }}
              >
                メールアドレス
              </Typography>

              <Typography variant="body1">{student.email}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 1,
                  color: colors.text.muted,
                }}
              >
                プロフィール状態
              </Typography>

              <Chip
                label={student.profile_completed ? "入力完了" : "未完了"}
                size="small"
                color={student.profile_completed ? "success" : "default"}
                sx={{
                  minWidth: 80,
                  height: 26,
                  fontWeight: 600,
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 0.5,
                  color: colors.text.muted,
                }}
              >
                学年
              </Typography>

              <Typography variant="body1">
                {student.grade.display_name}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 0.5,
                  color: colors.text.muted,
                }}
              >
                学校名
              </Typography>

              <Typography variant="body1">
                {student.high_school.name}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              mb: 2.5,
              color: colors.text.primary,
            }}
          >
            個人情報
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 0.5,
                  color: colors.text.muted,
                }}
              >
                生年月日
              </Typography>

              <Typography variant="body1">
                {student.user_personal_info.birthday}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 0.5,
                  color: colors.text.muted,
                }}
              >
                性別
              </Typography>

              <Typography variant="body1">{genderLabel}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 0.5,
                  color: colors.text.muted,
                }}
              >
                電話番号
              </Typography>

              <Typography variant="body1">
                {student.user_personal_info.phone_number || "未設定"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 0.5,
                  color: colors.text.muted,
                }}
              >
                住所
              </Typography>

              <Typography variant="body1">
                〒{student.address.postal_code} {addressText}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};
