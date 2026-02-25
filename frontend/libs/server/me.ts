import "server-only";
import { API_ORIGIN } from "./apiFetch";

export type MeUser = {
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

export const getMeFromRails = async (
  cookieHeader: string,
): Promise<MeUser | null> => {
  const response = await fetch(`${API_ORIGIN}/api/v1/me`, {
    method: "GET",
    headers: {
      Cookie: cookieHeader,
      "Content-Type": "application/json",
      Acccept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) return null;
  if (!response.ok) return null;

  const data = (await response.json().catch(() => null)) as {
    user?: MeUser;
  } | null;

  return data?.user ?? null;
};
