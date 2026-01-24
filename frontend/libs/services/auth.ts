import { User } from "@/types/login/user";
import { apiClient } from "../http/apiClient";

type SignUpType = {
    user: {
        email: string;
        name: string;
        name_kana: string;
        password: string;
        password_confirmation: string;
        user_role_name: string;
        school_name: string
    }
}

type UserRole = 'student' | 'admin' | 'teacher' | 'guardian';

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

    let roleName: UserRole = 'student';

    switch (user_role_name) {
        case 'admin':
            roleName = 'admin';
            break;
        case 'teacher':
            roleName = 'teacher';
            break;
        case 'guardian':
            roleName = 'guardian';
            break;
        default:
            break;
    }

    await apiClient.post<User>(
        `/api/v1/${roleName}/signup`,
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
}
