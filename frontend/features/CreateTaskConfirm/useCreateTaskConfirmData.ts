import { CourseType } from "@/types/task/confirm/confirm";
import { CreateTaskForm } from "@/types/task/new/form";

export const useCreateTaskConfirmData = () => {
  const stored = sessionStorage.getItem("CreateTaskData");
  const parsed = stored ? JSON.parse(stored) : null;

  const form = parsed.form ?? {};
  const courses: CourseType[] = parsed?.courses ?? [];
  const task: CreateTaskForm["task"] = parsed?.form?.task ?? {};
  const selectedUnitIds = form?.task.unit_ids ?? [];

  return { courses, task, selectedUnitIds }
};
