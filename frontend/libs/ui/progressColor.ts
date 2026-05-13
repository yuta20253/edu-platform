import { colors } from "@/app/theme/colors";

export const getProgressColor = (progress: number) => {
  return progress === 100
    ? colors.progress.completed
    : progress > 50
      ? colors.progress.in_progress
      : colors.progress.not_started;
};
