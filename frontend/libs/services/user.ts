import { apiClient } from "../http/apiClient";

export const getCurrentUser = async () => {
  try {
    const res = await apiClient.get(
      process.env.NEXT_PUBLIC_API_BASE_URL + "/api/v1/users",
    );
    return res.data.user;
  } catch (error) {
    console.error("ユーザー取得失敗", error);
    throw error;
  }
};
