import { getMeFromRails } from "@/libs/server/me";
import { Box, CircularProgress } from "@mui/material";
import { cookies } from "next/headers";
import { Presenter } from "./Presenter";

export const EditUserProfile = async () => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join(";");

  const user = await getMeFromRails(cookieHeader);

  if (!user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <Presenter user={user} />;
};
