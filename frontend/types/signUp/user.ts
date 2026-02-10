import { UserRole } from "./user_role";

export type User = {
  user: {
    email: string;
    name: string;
    name_kana: string;
    password: string;
    password_confirmation: string;
    user_role_name: UserRole;
    school_name: string;
  };
};
