import { Typography } from "@mui/material";
import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { RankChart } from "./RankChart";
import { RankData, RankParams, RankType } from "../types";

type Props = {
  type: RankType;
  // 選択が揃っていないときは null
  params: RankParams | null;
};

const Message = ({ children }: { children: string }) => (
  <Typography sx={{ textAlign: "center", py: 4, fontSize: 14 }}>
    {children}
  </Typography>
);

const RankResult = ({ params }: { params: RankParams }) => {
  const { data, error, refetch } = useApiQuery<RankData>(
    "/api/student/analytics",
    { params },
  );

  // 順位の取得失敗は画面全体ではなく、このセクションの中だけで伝える
  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(rank) => <RankChart data={rank} />}
    </AsyncBoundary>
  );
};

export const AnalyticsContent = ({ type, params }: Props) => {
  if (params === null) {
    return (
      <Message>
        {type === "unit_rank"
          ? "コースと単元を選択してください"
          : "教科とコースを選択してください"}
      </Message>
    );
  }

  // 選択が変わると別の対象の順位になるため、前の順位を残さず作り直す
  return <RankResult key={JSON.stringify(params)} params={params} />;
};
