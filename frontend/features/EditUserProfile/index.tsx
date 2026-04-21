import { getMeFromRails } from "@/libs/server/me";
import { Box, CircularProgress } from "@mui/material";
import { cookies } from "next/headers";
import { Presenter } from "./Presenter";
import { getPrefectures } from "@/libs/server/prefectures";

export const EditUserProfile = async () => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const user = await getMeFromRails(cookieHeader);
  const prefectures = await getPrefectures();

  if (!user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <Presenter user={user} prefectures={prefectures} />;
};
