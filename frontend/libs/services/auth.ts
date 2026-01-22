import { apiClient } from "../http/apiClient";

type LoginResponse = {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    user_role: {
      name: string;
    };
    high_school: {
      name: string;
    };
  };
};

export const loginAuth = async ({ email, password }: { email: string; password: string }): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>(
        '/api/v1/user/login',
        {email, password}
    );

    return res.data;
};
