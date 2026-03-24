import { railsFetch } from "@/libs/server/rails/railsFetch";
import { AdminDashboardPresenter } from "./Presenter";
import type { AdminDashboardData } from "./types";

export async function AdminDashboard() {
  const { data } = await railsFetch<AdminDashboardData>(
    "/api/v1/admin/dashboard",
  );
  return <AdminDashboardPresenter data={data} />;
}
