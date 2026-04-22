import { railsFetch } from "@/libs/server/rails/railsFetch";
import { Prefecture } from "@/types/common/prefecture";

export const getPrefectures = async (cookieHeader?: string) => {
  const { data } = await railsFetch("/api/v1/prefectures", {
    method: "GET",
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });

  return data as Prefecture[];
};
