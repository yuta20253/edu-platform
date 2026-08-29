import { JSX } from "react";

import { cookies } from "next/headers";
import { getStudentDashboard } from "@/libs/server/studentDashboard";
import { Presenter } from "./Presenter";
import { redirect } from "next/navigation";

export const Home = async (): Promise<JSX.Element> => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  try {
    const goals = await getStudentDashboard(cookieHeader);

    return <Presenter initialGoals={goals} />;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      redirect("/login");
    }

    return <Presenter initialGoals={[]} />;
  }
};
