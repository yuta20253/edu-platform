export type MeUser = {
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

  user_role: {
    name: string;
  };

  high_school?: {
    name: string;
  };

  grade?: {
    year: number;
    display_name: string;
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
