export type School = {
  id: number;
  name: string;
  prefecture_name: string;
  student_count: number;
  teacher_count: number;
};

export type SchoolMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

export type AdminSchoolsData = {
  schools: School[];
  meta: SchoolMeta;
};
