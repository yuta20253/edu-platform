import { User } from "@/types/user";
import { apiClient } from "../http/apiClient";

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
