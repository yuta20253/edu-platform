import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMeFromRails } from "@/libs/server/me";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const user = await getMeFromRails(cookieHeader);

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
