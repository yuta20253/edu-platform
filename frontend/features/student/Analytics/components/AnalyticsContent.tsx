import { Typography } from "@mui/material";
import { needsCourse, needsUnit } from "../selectionRequirements";
import { TaskCompletionChart } from "./TaskCompletionChart";
import { UnderstandingScoreChart } from "./UnderstandingScoreChart";
import { GradeAverageChart } from "./GradeAverageChart";
import { RankChart } from "./RankChart";
import { AnalyticsResult, AnalyticsType } from "../types";

type Props = {
  type: AnalyticsType;
  result: AnalyticsResult | null;
  courseId: number | null;
  unitId: number | null;
};

export const AnalyticsContent = ({ type, result, courseId, unitId }: Props) => {
  if (result === null) {
    return (
      <Typography sx={{ textAlign: "center", py: 4 }}>
        {needsUnit(type) && (courseId === null || unitId === null)
          ? "コースと単元を選択してください"
          : needsCourse(type) && courseId === null
            ? "教科とコースを選択してください"
            : "データがありません"}
      </Typography>
    );
  }

  switch (result.type) {
    case "task_completion":
      return <TaskCompletionChart data={result.data} />;
    case "understanding_score":
      return <UnderstandingScoreChart data={result.data} />;
    case "grade_average":
      return <GradeAverageChart data={result.data} />;
    case "course_rank":
    case "unit_rank":
      return <RankChart data={result.data} />;
  }
};
