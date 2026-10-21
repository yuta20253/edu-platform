"use client";

import { Typography } from "@mui/material";
import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { RankChart } from "./RankChart";
import { RankData, RankType } from "../types";

type Props = {
  type: RankType;
  // 教科→コース(→単元)を選び終えているか
  selected: boolean;
  data: RankData | null;
  error: boolean;
  onRetry: () => void;
};

const Message = ({ children }: { children: string }) => (
  <Typography sx={{ textAlign: "center", py: 4, fontSize: 14 }}>
    {children}
  </Typography>
);

export const RankContent = ({
  type,
  selected,
  data,
  error,
  onRetry,
}: Props) => {
  if (!selected) {
    return (
      <Message>
        {type === "unit_rank"
          ? "コースと単元を選択してください"
          : "教科とコースを選択してください"}
      </Message>
    );
  }

  // 順位の取得失敗は画面全体ではなく、このセクションの中だけで伝える
  return (
    <AsyncBoundary data={data} error={error} onRetry={onRetry}>
      {(rank) => <RankChart data={rank} />}
    </AsyncBoundary>
  );
};
