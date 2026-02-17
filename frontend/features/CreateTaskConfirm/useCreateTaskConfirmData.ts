import { CourseType } from "./types";
import { CreateTaskForm } from "@/features/CreateTask/types";

export const useCreateTaskConfirmData = () => {
  const stored = sessionStorage.getItem("CreateTaskData");
  const parsed = stored ? JSON.parse(stored) : null;

  const form = parsed.form ?? {};
  const courses: CourseType[] = parsed?.courses ?? [];
  const task: CreateTaskForm = parsed?.form ?? {};
  const selectedUnitIds = form?.unit_ids ?? [];

  return { courses, task, selectedUnitIds };
};
