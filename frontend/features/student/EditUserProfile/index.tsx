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

  // 親のレイアウト(app/(main)/(authenticated)/layout.tsx)でもガードしているが、
  // ページ単体でもスピナーで止まらないよう同じ扱いにする(多重防御)。
  // このページは認証が必要なので、未ログインなら都道府県を取りにいかず、先に /login へ返す。
  if (!user) {
    redirect("/login");
  }

  const prefectures = await getPrefectures();

  return <Container user={user} prefectures={prefectures} />;
};
