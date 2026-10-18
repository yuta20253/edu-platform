import { Box, CircularProgress, Typography } from "@mui/material";
import { RankChart } from "./RankChart";
import { RankData, RankType } from "../types";

type Props = {
  type: RankType;
  data: RankData | null;
  courseId: number | null;
  unitId: number | null;
  loading: boolean;
  error: boolean;
};

const Message = ({ children }: { children: string }) => (
  <Typography sx={{ textAlign: "center", py: 4, fontSize: 14 }}>
    {children}
  </Typography>
);

export const AnalyticsContent = ({
  type,
  data,
  courseId,
  unitId,
  loading,
  error,
}: Props) => {
  if (type === "unit_rank" && (courseId === null || unitId === null)) {
    return <Message>コースと単元を選択してください</Message>;
  }
  if (courseId === null) {
    return <Message>教科とコースを選択してください</Message>;
  }
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  // 順位の取得失敗は画面全体ではなく、このセクションの中だけで伝える
  if (error) {
    return <Message>順位の取得に失敗しました</Message>;
  }
  if (data === null) {
    return <Message>データがありません</Message>;
  }

  return <RankChart data={data} />;
};
