import { BarChart } from "@mui/x-charts/BarChart";
import { colors } from "@/app/theme/colors";
import { GradeAverageData } from "../types";

type Props = {
  data: GradeAverageData;
};

export const GradeAverageChart = ({ data }: Props) => {
  return (
    <BarChart
      height={300}
      xAxis={[{ scaleType: "band", data: ["正答率", "タスク達成率"] }]}
      yAxis={[{ min: 0, max: 100 }]}
      series={[
        {
          label: "自分",
          data: [data.correct_rate.my, data.task_completion_rate.my],
          color: colors.brand.primary,
        },
        {
          label: "学年平均",
          data: [
            data.correct_rate.average,
            data.task_completion_rate.average,
          ],
          color: colors.text.muted,
        },
      ]}
    />
  );
};
