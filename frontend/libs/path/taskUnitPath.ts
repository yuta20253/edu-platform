export const taskUnitPath = (
  taskId: number,
  unitId: number,
  goalId?: number,
) =>
  goalId
    ? `/goals/${goalId}/tasks/${taskId}/units/${unitId}`
    : `/tasks/${taskId}/units/${unitId}`;
