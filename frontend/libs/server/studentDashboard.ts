import { API_ORIGIN } from "./apiFetch";

export type GoalType = {
  id: number;
  title: string;
  description: string;
  status: string;
  due_date: string;
};

export const getStudentDashboard = async (
  cookieHeader: string,
): Promise<GoalType[]> => {
  const response = await fetch(`${API_ORIGIN}/api/v1/student/dashboard`, {
    method: "GET",
    headers: {
      Cookie: cookieHeader,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!response.ok) {
    throw new Error(`dashboard fetch error: ${response.status}`);
  }

  const data = (await response.json()) as GoalType[];

  return data;
};
