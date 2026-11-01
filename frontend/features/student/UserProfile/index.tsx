import { getMeFromBackend } from "@/libs/server/me";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Presenter } from "./Presenter";

export const UserProfile = async () => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const user = await getMeFromBackend(cookieHeader);

  // 親のレイアウト(app/(main)/(authenticated)/layout.tsx)でもガードしているが、
  // ページ単体でもスピナーで止まらないよう同じ扱いにする(多重防御)。
  if (!user) {
    redirect("/login");
  }

  return <Presenter user={user} />;
};
