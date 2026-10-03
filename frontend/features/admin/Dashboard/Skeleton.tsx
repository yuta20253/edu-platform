"use client";

import { colors } from "@/app/theme/colors";
import { Box, Card, CardContent } from "@mui/material";
import MuiSkeleton from "@mui/material/Skeleton";

const KPI_CARD_COUNT = 4;
const IMPORT_ROW_COUNT = 5;
const ANNOUNCEMENT_ROW_COUNT = 3;

const cardSx = {
  border: `1px solid ${colors.border.light}`,
  borderRadius: 2,
};

// 実レイアウトと同一のグリッドに骨格を載せることで、データ到着時の
// レイアウト跳ね（チラつき）を防ぐ。Presenter.tsxのグリッド定義と揃えること。
export const Skeleton = () => {
  return (
    <Box sx={{ p: 3 }}>
      <MuiSkeleton variant="text" width={180} height={40} sx={{ mb: 3 }} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 4,
        }}
      >
        {Array.from({ length: KPI_CARD_COUNT }).map((_, i) => (
          <Card
            key={i}
            elevation={0}
            sx={cardSx}
            data-testid="kpi-card-skeleton"
          >
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <MuiSkeleton variant="circular" width={44} height={44} />
              <Box sx={{ flex: 1 }}>
                <MuiSkeleton variant="text" width="60%" />
                <MuiSkeleton variant="text" width="40%" height={32} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 3,
        }}
      >
        <Card elevation={0} sx={cardSx}>
          <CardContent>
            <MuiSkeleton variant="text" width={160} sx={{ mb: 2 }} />
            {Array.from({ length: IMPORT_ROW_COUNT }).map((_, i) => (
              <MuiSkeleton
                key={i}
                variant="rectangular"
                height={32}
                sx={{ mb: 1, borderRadius: 1 }}
                data-testid="import-row-skeleton"
              />
            ))}
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Card elevation={0} sx={cardSx}>
            <CardContent>
              <MuiSkeleton variant="text" width={120} sx={{ mb: 2 }} />
              {Array.from({ length: ANNOUNCEMENT_ROW_COUNT }).map((_, i) => (
                <MuiSkeleton
                  key={i}
                  variant="rectangular"
                  height={40}
                  sx={{ mb: 1, borderRadius: 1 }}
                  data-testid="announcement-row-skeleton"
                />
              ))}
            </CardContent>
          </Card>

          <Card elevation={0} sx={cardSx}>
            <CardContent>
              <MuiSkeleton variant="text" width={140} sx={{ mb: 2 }} />
              <MuiSkeleton
                variant="rectangular"
                height={36}
                sx={{ mb: 1.5, borderRadius: 1 }}
              />
              <MuiSkeleton
                variant="rectangular"
                height={36}
                sx={{ mb: 1.5, borderRadius: 1 }}
              />
              <MuiSkeleton
                variant="rectangular"
                height={36}
                sx={{ borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};
