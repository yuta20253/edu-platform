// 管理者詳細 API（GET /api/admin/admins/:id）のレスポンス。
// activity_log は現状 [] を返すプレースホルダー。
export type AdminDetail = {
  id: number;
  name: string;
  name_kana: string | null;
  email: string;
  created_at: string;
  updated_at: string;
  activity_log: unknown[];
  user_personal_info?: {
    id: number;
    phone_number: string | null;
    birthday: string | null;
    gender: string | null;
  } | null;
  address?: {
    id: number;
    postal_code: string;
    city: string;
    town: string;
    prefecture: {
      id: number;
      name: string;
    } | null;
  } | null;
};

// 管理者の更新（PATCH）で送る入力。
// 個人情報・住所は任意（未設定の admin を弾かない）。
export type UpdateAdminInput = {
  name: string;
  name_kana?: string;
  email: string;
  phone_number?: string;
  birthday?: string;
  gender?: string;
  address_id?: number | null;
};

// 編集フォームの内部値（住所カスケード用に都道府県/市区町村/町名を持つ）。
export type AdminEditForm = {
  name: string;
  name_kana: string;
  email: string;
  phone_number: string;
  birthday: string;
  gender: string;
  prefecture_id: number | null;
  city: string;
  town: string;
  address_id: number | null;
};

// 住所カスケードの町名候補。
export type Address = {
  id: number;
  city: string;
  town: string;
};

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};
