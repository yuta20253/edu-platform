import { GenderType } from "@/types/common/gender";

export type Teacher = {
  id: number;
  name: string;
  name_kana: string;
  grade: {
    year: number;
    display_name: string;
  };
  teacher_permission: {
    id: number;
    grade_scope: number;
    manage_other_teachers: boolean;
  };
  user_personal_info?: {
    id: number;
    phone_number: string;
    birthday: string;
    gender: GenderType;
  };
  address?: {
    id: number;
    postal_code: string;
    city: string;
    town: string;
    street_address: string;
    prefecture: {
      id: number;
      name: string;
    };
  };
};
