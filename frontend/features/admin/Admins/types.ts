import type { PaginationMeta } from "@/types/common/pagination";

type Admin = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

export type AdminsData = {
  admins: Admin[];
  meta: PaginationMeta;
};

export type CreateAdminInput = {
  name: string;
  email: string;
};
