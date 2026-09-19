import { Box, Typography } from "@mui/material";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { colors } from "@/app/theme/colors";
import { RankData } from "../types";

type Props = {
  data: RankData;
};

export const RankChart = ({ data }: Props) => {
  if (data.rank === null) {
    return (
      <Typography sx={{ textAlign: "center", py: 4 }}>
        対象の学習履歴がまだありません(全{data.total_users}人中)
      </Typography>
    );
  }

  const percentile =
    data.total_users > 0
      ? Math.round(
          ((data.total_users - data.rank + 1) / data.total_users) * 100,
        )
      : 0;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Gauge
        width={200}
        height={200}
        value={percentile}
        valueMax={100}
        text={() => `${data.rank}位`}
        sx={{
          [`& .${gaugeClasses.valueArc}`]: { fill: colors.brand.primary },
        }}
      />
      <Typography>
        {data.total_users}人中 {data.rank}位
      </Typography>
    </Box>
  );
};
