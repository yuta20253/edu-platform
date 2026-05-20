"use client";

import { useRouter } from "next/navigation";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { colors } from "@/app/theme/colors";

type UnitType = {
  id: number;
  course_id: number;
  unit_name: string;
  course: {
    id: number;
    level_number: number;
    level_name: string;
  };
};

type Props = {
  unit: UnitType;
};

export const Presenter = ({ unit }: Props) => {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 3,
        bgcolor: colors.surface.default,
      }}
    >
      <Box sx={{ mb: 3, textAlign: "center" }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: "bold", color: colors.text.primary }}
        >
          ユニット学習画面
        </Typography>
      </Box>

      <Card
        sx={{
          width: "min(720px, 90vw)",
          borderRadius: 3,
          boxShadow: 3,
          bgcolor: colors.surface.white,
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 600,
                mb: 1,
                color: colors.text.primary,
              }}
            >
              {unit.course.level_name}レベル{unit.course.level_number}
            </Typography>
            <Typography
              sx={{ fontSize: 16, color: colors.text.secondary, mb: 1 }}
            >
              単元: {unit.unit_name}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: colors.surface.light,
              minHeight: 160,
              mb: 4,
            }}
          >
            <Typography
              sx={{ fontSize: 14, lineHeight: 1.8, color: colors.text.primary }}
            >
              この画面から学習をスタートできます。
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Button
              variant="contained"
              size="large"
              sx={{
                borderRadius: 2,
                minWidth: 140,
                backgroundColor: colors.brand.primary,
                color: colors.text.inverse,
                "&:hover": {
                  backgroundColor: colors.brand.primaryHover,
                },
              }}
              onClick={() => {
                console.log("スタートボタンが押されました");
              }}
            >
              スタート
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderRadius: 2,
                minWidth: 140,
                borderColor: colors.border.default,
                color: colors.text.primary,
                "&:hover": {
                  backgroundColor: colors.surface.info,
                  borderColor: colors.border.default,
                },
              }}
              onClick={() => router.back()}
            >
              戻る
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
