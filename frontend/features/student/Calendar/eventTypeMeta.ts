import FlagIcon from "@mui/icons-material/Flag";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ForumIcon from "@mui/icons-material/Forum";
import type { SvgIconComponent } from "@mui/icons-material";
import { colors } from "@/app/theme/colors";
import { statusLabel } from "@/constants/status";
import type { StatusBadgeDefinition } from "@/components/ui/StatusBadge";
import type { Status } from "@/types/common/status";
import type { CalendarEventType, InterviewRequestStatus } from "./types";

// イベント種別ごとの見た目(ラベル・色・アイコン)。カレンダーのセルと予定一覧・凡例で共通に使う
export const eventTypeMeta: Record<
  CalendarEventType,
  { label: string; color: string; Icon: SvgIconComponent }
> = {
  goal: { label: "目標", color: colors.kpi.purple, Icon: FlagIcon },
  task: { label: "タスク", color: colors.kpi.blue, Icon: AssignmentIcon },
  interview_request: {
    label: "面談",
    color: colors.kpi.amber,
    Icon: ForumIcon,
  },
};

const progressStatusDefinitions: Record<Status, StatusBadgeDefinition> = {
  not_started: { label: statusLabel.not_started, color: "default" },
  in_progress: { label: statusLabel.in_progress, color: "info" },
  completed: { label: statusLabel.completed, color: "success" },
};

const interviewRequestStatusDefinitions: Record<
  InterviewRequestStatus,
  StatusBadgeDefinition
> = {
  requested: { label: "申請中", color: "default" },
  scheduling: { label: "日程調整中", color: "warning" },
  confirmed: { label: "確定", color: "info" },
  completed: { label: "完了", color: "success" },
  cancelled: { label: "キャンセル", color: "default" },
};

export const statusDefinitionsByType: Record<
  CalendarEventType,
  Record<string, StatusBadgeDefinition>
> = {
  goal: progressStatusDefinitions,
  task: progressStatusDefinitions,
  interview_request: interviewRequestStatusDefinitions,
};
