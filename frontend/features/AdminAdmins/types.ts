export type Admin = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

export type AdminMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

export type AdminsData = {
  admins: Admin[];
  meta: AdminMeta;
};

export type CreateAdminInput = {
  name: string;
  email: string;
};
