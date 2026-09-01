import { cookies } from "next/headers";
import { getMeFromRails } from "@/libs/server/me";
import { getPrefectures } from "@/libs/server/prefectures";
import { AdminDetail } from "@/features/admin/AdminDetail";

type Props = {
  params: Promise<{ adminId: string }>;
};

const AdminAdminDetailPage = async ({ params }: Props) => {
  const { adminId } = await params;

  // 自己削除ガードのため、ログイン中の管理者 ID を取得して渡す
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const me = await getMeFromRails(cookieHeader);

  // 住所カスケードの都道府県プルダウン用
  const prefectures = await getPrefectures(cookieHeader);

  return (
    <AdminDetail
      adminId={Number(adminId)}
      currentAdminId={me?.id ?? null}
      prefectures={prefectures}
    />
  );
};

export default AdminAdminDetailPage;
