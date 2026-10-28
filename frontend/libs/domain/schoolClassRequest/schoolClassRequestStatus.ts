// 学級申請ステータスの判定。
import { schoolClassRequestStatuses } from "@/constants/school_class_request";
import type { SchoolClassRequestStatus } from "@/types/schoolClassRequest/schoolClassRequest";

// クエリなど外部から来た文字列が学級申請のステータスかを判定する
export const isSchoolClassRequestStatus = (
  value: string,
): value is SchoolClassRequestStatus =>
  (schoolClassRequestStatuses as string[]).includes(value);
