import { railsFetch } from "@/libs/server/rails/railsFetch";

type Prefecture = {
  id: number;
  name: string;
};

export const getPrefectures = async (cookieHeader?: string) => {
  const { data } = await railsFetch("/api/v1/prefectures", {
    method: "GET",
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });

  return data as Prefecture[];
};
