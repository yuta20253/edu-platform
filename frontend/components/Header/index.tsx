import { getMeFromRails } from "@/libs/server/me";
import { cookies } from "next/headers";
import { JSX } from "react";
import { HeaderClient } from "./HeaderClient";

export const Header = async (): Promise<JSX.Element> => {
  const cookieHeader = cookies().toString();
  const user = await getMeFromRails(cookieHeader);

  return <HeaderClient user={user} />;
};
