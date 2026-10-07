import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMeFromRails } from "@/libs/server/me";
import { AccountLink } from "@/features/student/AccountLink";

export default async function AccountLinkPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const me = await getMeFromRails(cookieHeader);

  if (me?.account_linked) {
    redirect("/profile");
  }

  return <AccountLink />;
}
