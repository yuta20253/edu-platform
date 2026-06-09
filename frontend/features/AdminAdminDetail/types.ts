// 管理者詳細 API（GET /api/admin/admins/:id）のレスポンス。
// activity_log は現状 [] を返すプレースホルダー。
export type AdminDetail = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  activity_log: unknown[];
};

// 管理者の更新（PATCH）で送る入力。
export type UpdateAdminInput = {
  name: string;
  email: string;
};

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};
