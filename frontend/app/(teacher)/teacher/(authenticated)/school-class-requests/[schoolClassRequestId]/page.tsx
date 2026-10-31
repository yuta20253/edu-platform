import { SchoolClassRequestDetail } from "@/features/teacher/SchoolClassRequestDetail";
import { isNumericId } from "@/libs/server/routeParams";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ schoolClassRequestId: string }>;
};

export default async function SchoolClassRequestDetailPage({ params }: Props) {
  const { schoolClassRequestId } = await params;

  // schoolClassRequestIdが数値でない場合はBFFへ問い合わせず404にする
  if (!isNumericId(schoolClassRequestId)) {
    notFound();
  }

  // 別の申請へ移ったときに前の申請の内容やダイアログが残らないよう作り直す
  return (
    <SchoolClassRequestDetail
      key={schoolClassRequestId}
      schoolClassRequestId={Number(schoolClassRequestId)}
    />
  );
}
