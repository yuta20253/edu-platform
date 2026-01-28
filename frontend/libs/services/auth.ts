import { User } from "@/types/login/user";
import { apiClient } from "../http/apiClient";
import { UserRole } from "@/types/signUp/user_role";

type SignUpType = {
    user: {
        email: string;
        name: string;
        name_kana: string;
        password: string;
        password_confirmation: string;
        user_role_name: UserRole;
        school_name: string
    }
}

export const loginAuth = async ({ email, password }: { email: string; password: string }): Promise<{user: User; token: string | null}> => {
    const res = await apiClient.post<User>(
        '/api/v1/user/login',
        {email, password}
    );

    const authHeader = res.headers['authorization'];
    const token = authHeader.replace("Bearer ", "") ?? null;

    return {
      user: res.data,
      token,
    };
};

export const signUpAuth = async ({ user: { email, name, name_kana, password, password_confirmation, user_role_name, school_name } }: SignUpType): Promise<void> => {
    await apiClient.post<User>(
        `/api/v1/${user_role_name}/signup`,
        {
            user: {
                email,
                name,
                name_kana,
                password,
                password_confirmation,
                user_role_name,
                school_name
            }
        }
    )
    return;
};
