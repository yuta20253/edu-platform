type SchoolClassType = {
  id: number;
  name: string;
};

export type GradeWithSchoolClasses = {
  id: number;
  year: number;
  display_name: string;
  school_classes: SchoolClassType[];
};
