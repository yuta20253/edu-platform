import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMeFromRails } from "@/libs/server/me";
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";
import { Box } from "@mui/material";

export default async function TeacherAuthenticatedLayout({
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

  if (!user || user.user_role?.name !== "teacher") {
    redirect("/login");
  }

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <TeacherSidebar user={user} />
      <Box
        component="main"
        sx={{ flex: 1, overflowY: "auto", bgcolor: "#f8fafc" }}
      >
        {children}
      </Box>
    </Box>
  );
}
