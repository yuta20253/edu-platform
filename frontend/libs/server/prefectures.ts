import { backendFetch } from "@/libs/server/backend/fetch";
import { Prefecture } from "@/types/common/prefecture";

export const getPrefectures = async (cookieHeader?: string) => {
  const { data } = await backendFetch("/api/v1/prefectures", {
    method: "GET",
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });

  return data as Prefecture[];
};
