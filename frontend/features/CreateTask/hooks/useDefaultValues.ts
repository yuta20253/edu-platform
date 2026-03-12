import { useMemo } from "react";
import { PRIORITY } from "../constants";
import { CreateTaskForm } from "../types";
import { DraftTaskType } from "@/features/CreateTaskConfirm/useFetchDraftTask";

type Props = {
  draftTask: DraftTaskType | null;
  goalId: number;
}

export const useDefaultValues = ({draftTask, goalId}: Props): CreateTaskForm => {
    const result = useMemo(() => {
        if (!draftTask) {
            return {
                goal_id: goalId,
                title: "",
                content: "",
                priority: PRIORITY.NORMAL,
                due_date: null,
                unit_ids: [],
            };
        }

        const priority =
        typeof draftTask.priority === "number"
            ? draftTask.priority
            : PRIORITY.NORMAL;

        const unitIds = draftTask.units?.map((u) => u.id) ?? [];

        return {
            goal_id: draftTask.goal_id,
            title: draftTask.title ?? "",
            content: draftTask.content ?? "",
            priority: priority,
            due_date: draftTask.due_date ? new Date(draftTask.due_date) : null,
            unit_ids: unitIds,
        }
    }, [draftTask, goalId])

    return result;
};
