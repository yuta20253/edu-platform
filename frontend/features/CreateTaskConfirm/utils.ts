import { CourseType, UnitType } from "./types";

export const buildGroupedUnits = (
  courses: CourseType[],
  selectedUnitIds: number[],
) => {
  return courses
    .map((course: CourseType) => ({
      courseId: course.id,
      courseName: course.level_name,
      levelNumber: course.level_number,
      units: course.units.filter((unit: UnitType) =>
        selectedUnitIds.includes(unit.id),
      ),
    }))
    .filter((course) => course.units.length > 0);
};
