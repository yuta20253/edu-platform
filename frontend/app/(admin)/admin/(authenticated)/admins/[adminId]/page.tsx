import { cookies } from "next/headers";
import { getMeFromRails } from "@/libs/server/me";
import { AdminAdminDetail } from "@/features/AdminAdminDetail";

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

  return (
    <AdminAdminDetail
      adminId={Number(adminId)}
      currentAdminId={me?.id ?? null}
    />
  );
};

export default AdminAdminDetailPage;
