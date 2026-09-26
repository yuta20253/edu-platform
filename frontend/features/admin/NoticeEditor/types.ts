// 配信タイミングの選択肢。
// draft: 下書き保存 / immediate: 即時配信 / scheduled: 予約配信
export type DeliveryTiming = "draft" | "immediate" | "scheduled";

// フォームの内部値。scheduledAtはPickerとやり取りしやすいようDateで保持し、
// API送信直前にISO文字列へ変換する。
export type NoticeFormValues = {
  title: string;
  content: string;
  deliveryTiming: DeliveryTiming;
  scheduledAt: Date | null;
};
