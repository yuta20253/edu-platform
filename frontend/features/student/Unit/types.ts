export type UnitType = {
  id: number;
  course_id: number;
  unit_name: string;
  course: {
    id: number;
    level_number: number;
    level_name: string;
  };
};
