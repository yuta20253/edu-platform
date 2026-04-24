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
import { AddressLabel, GenderLabel } from "./constants";
import { Teacher } from "./types";

type Props = {
  teacher: Teacher;
};

export const Presenter = ({ teacher }: Props) => {
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
          教員詳細
        </Typography>

        <Button
          component={Link}
          href="/teacher/colleagues"
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
                  color: colors.text.muted,
                  display: "block",
                  mb: 0.5,
                }}
              >
                氏名
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {teacher.name}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  color: colors.text.muted,
                  display: "block",
                  mb: 0.5,
                }}
              >
                氏名カナ
              </Typography>
              <Typography variant="body1">{teacher.name_kana}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  color: colors.text.muted,
                  display: "block",
                  mb: 0.5,
                }}
              >
                担当学年
              </Typography>
              <Typography variant="body1">
                {teacher.grade.display_name}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  color: colors.text.muted,
                  display: "block",
                  mb: 1,
                }}
              >
                学年操作範囲
              </Typography>
              <Chip
                label={
                  teacher.teacher_permission.grade_scope ? "自学年" : "全学年"
                }
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  minWidth: 72,
                  height: 26,
                  fontWeight: 600,
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  color: colors.text.muted,
                  display: "block",
                  mb: 1,
                }}
              >
                他職員操作権限
              </Typography>
              <Chip
                label={
                  teacher.teacher_permission.manage_other_teachers ? "有" : "無"
                }
                size="small"
                color={
                  teacher.teacher_permission.manage_other_teachers
                    ? "success"
                    : "default"
                }
                sx={{
                  minWidth: 56,
                  height: 26,
                  fontWeight: 600,
                }}
              />
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
                  color: colors.text.muted,
                  display: "block",
                  mb: 0.5,
                }}
              >
                生年月日
              </Typography>
              <Typography>
                {teacher.user_personal_info?.birthday || "未設定"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  color: colors.text.muted,
                  display: "block",
                  mb: 0.5,
                }}
              >
                性別
              </Typography>
              <Typography>
                {teacher.user_personal_info?.gender
                  ? GenderLabel[teacher.user_personal_info.gender]
                  : "未設定"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="caption"
                sx={{
                  color: colors.text.muted,
                  display: "block",
                  mb: 0.5,
                }}
              >
                電話番号
              </Typography>
              <Typography>
                {teacher.user_personal_info?.phone_number || "未設定"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography
                variant="caption"
                sx={{
                  color: colors.text.muted,
                  display: "block",
                  mb: 0.5,
                }}
              >
                住所
              </Typography>
              <Typography>
                {teacher.address ? AddressLabel(teacher.address) : "未設定"}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};
