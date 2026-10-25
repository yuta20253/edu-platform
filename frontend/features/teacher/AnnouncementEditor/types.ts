// 配信タイミングの選択肢。
// draft: 下書き保存 / immediate: 即時配信 / scheduled: 予約配信
export type DeliveryTiming = "draft" | "immediate" | "scheduled";

// 配信先の指定方法。announcement_targetsの1行に対応する。
export type TargetType =
  | "all_users"
  | "by_role"
  | "by_grade"
  | "by_school"
  | "by_user";

export type AnnouncementTargetInput = {
  target_type: TargetType;
  grade_id?: number;
  user_role_id?: number;
  user_id?: number;
};

// フォームの内部値。scheduledAtはPickerとやり取りしやすいようDateで保持し、
// API送信直前にISO文字列へ変換する。
export type AnnouncementFormValues = {
  title: string;
  content: string;
  targets: AnnouncementTargetInput[];
  deliveryTiming: DeliveryTiming;
  scheduledAt: Date | null;
};

// GET /api/teacher/announcements/new（配信先ピッカー用データ）のレスポンス形状。
export type GradeOption = {
  id: number;
  year: number;
  display_name: string;
};

export type UserRoleOption = {
  id: number;
  name: string;
};

export type StudentOption = {
  id: number;
  name: string;
  name_kana: string;
  grade: {
    display_name: string;
  };
};

export type AnnouncementTargetOptions = {
  grades: GradeOption[];
  user_roles: UserRoleOption[];
  students: {
    items: StudentOption[];
    meta: {
      current_page: number;
      total_pages: number;
      total_count: number;
      per_page: number;
    };
  };
  // own_grade権限の教員が選択を許可されている学年ID。nullなら制限なし。
  own_grade_restriction: number | null;
};

// GET /api/teacher/announcements/:id/edit（編集対象の現在の値）のレスポンス形状。
// 配信済みのお知らせは404になるため、statusはdraftかscheduledのみ。
export type EditableAnnouncement = {
  id: number;
  title: string;
  content: string;
  status: "draft" | "scheduled";
  scheduled_at: string | null;
};

// 配信先の1行。id・high_school_id・user_nameは表示用で、PATCHでは送らない。
// user_nameはby_userの配信先だけに値が入る。
export type EditableAnnouncementTarget = {
  id: number;
  target_type: TargetType;
  high_school_id: number | null;
  grade_id: number | null;
  user_role_id: number | null;
  user_id: number | null;
  user_name: string | null;
};

export type AnnouncementEditData = {
  announcement: EditableAnnouncement;
  announcement_targets: EditableAnnouncementTarget[];
};
