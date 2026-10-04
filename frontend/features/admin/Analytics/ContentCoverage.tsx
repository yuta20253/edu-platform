"use client";

import { colors } from "@/app/theme/colors";
import { Box, Card, CardContent, Typography } from "@mui/material";
import Link from "next/link";
import type { ContentCoverage as ContentCoverageData } from "./types";

type Props = {
  coverage: ContentCoverageData;
};

export const ContentCoverage = ({ coverage }: Props) => {
  const items = [
    { label: "総単元数", value: coverage.total_units },
    { label: "問題が未登録の単元", value: coverage.units_without_questions },
    { label: "期間内に解答がない単元", value: coverage.units_without_answers },
  ];

  return (
    <Card
      elevation={0}
      sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
    >
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          コンテンツカバレッジ
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {items.map((item) => (
            <Box key={item.label}>
              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {item.value.toLocaleString("ja-JP")}件
              </Typography>
            </Box>
          ))}
        </Box>
        {coverage.units_without_questions > 0 && (
          <Typography variant="body2" sx={{ mt: 1.5 }}>
            <Link href="/admin/courses" style={{ color: colors.brand.primary }}>
              講座一覧で問題をインポートする
            </Link>
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
