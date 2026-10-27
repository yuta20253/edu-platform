import { getMeFromBackend } from "@/libs/server/me";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Container } from "./Container";
import { getPrefectures } from "@/libs/server/prefectures";

export const EditUserProfile = async () => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const user = await getMeFromBackend(cookieHeader);

  // 親のレイアウト(app/(main)/(authenticated)/layout.tsx)と同じ扱いにする。
  // クライアント遷移ではレイアウトが再描画されず、ここが唯一のガードになりうる。
  // 都道府県の取得は 401 のとき例外になるため、必ずこの判定より後ろにする。
  if (!user) {
    redirect("/login");
  }

  const prefectures = await getPrefectures();

  return <Container user={user} prefectures={prefectures} />;
};
