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

  // 親のレイアウト(app/(main)/(authenticated)/layout.tsx)と同じ扱いにする。
  // クライアント遷移ではレイアウトが再描画されず、ここが唯一のガードになりうる。
  if (!user) {
    redirect("/login");
  }

  return <Presenter user={user} />;
};
