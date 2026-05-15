export type StudentType = {
  id: number;
  name: string;
  name_kana: string;
  grade: {
    display_name: string;
  };
};

export type StudentMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

export type StudentsData = {
  students: StudentType[];
  meta: StudentMeta;
};
