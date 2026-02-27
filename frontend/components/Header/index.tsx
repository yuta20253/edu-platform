import { getMeFromRails } from "@/libs/server/me";
import { cookies } from "next/headers";
import { JSX } from "react";
import { Presenter } from "./Presenter";

export const Header = async (): Promise<JSX.Element> => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const user = await getMeFromRails(cookieHeader);

  return <Presenter user={user} />;
};
