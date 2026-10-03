import type { StatusBadgeDefinition } from "@/components/ui/StatusBadge";
import { colors } from "@/app/theme/colors";
import type { TeacherNotificationStatus } from "./types";

export const statusDefinitions: Record<
  TeacherNotificationStatus,
  StatusBadgeDefinition
> = {
  sent: {
    label: "成功",
    color: colors.status.success,
  },
  failed: {
    label: "失敗",
    color: colors.status.error,
  },
};
