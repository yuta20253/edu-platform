export type Student = {
  id: number;
  name: string;
  name_kana: string;
  email: string;
  profile_completed: boolean;
  user_personal_info?: {
    id: number;
    phone_number: string;
    birthday: string;
    gender: string;
  };
  high_school: {
    name: string;
  };
  address?: {
    id: number;
    postal_code: string;
    city: string;
    town: string;
    prefecture: {
      id: number;
      name: string;
    };
  };
  grade: {
    year: number;
    display_name: string;
  };
};
