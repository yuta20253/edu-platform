// バックエンドの Teacher::SchoolClassRequestSerializer に対応する型。
// enum の値は バックエンドの SchoolClassRequest と対応させること。
export type SchoolClassRequestAction = "creation" | "modification" | "deletion";

export type SchoolClassRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

type IdAndName = {
  id: number;
  name: string;
};

export type SchoolClassRequest = {
  id: number;
  action: SchoolClassRequestAction;
  status: SchoolClassRequestStatus;
  // 新設・改名の申請では申請したクラス名。削除の申請では null
  name: string | null;
  // 却下・取消の理由
  reason: string | null;
  lock_version: number;
  approved_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  // 新設の申請・承認後に削除されたクラスでは null
  school_class: IdAndName | null;
  applicant: IdAndName;
  // 未処理の申請では null
  approver: IdAndName | null;
  grade: {
    id: number;
    year: number;
    display_name: string;
  };
  // 承認/却下できるか(権限があり、他の教員の承認待ちの申請)
  can_process: boolean;
  // 取り消せるか(自分の承認待ちの申請)
  can_cancel: boolean;
};
