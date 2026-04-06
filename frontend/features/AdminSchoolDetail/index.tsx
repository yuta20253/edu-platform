"use client";

import { Box, CircularProgress } from "@mui/material";
import { Presenter } from "./Presenter";
import { useAdminSchoolDetail } from "./hooks";

type Props = {
  schoolId: number;
};

export const AdminSchoolDetail = ({ schoolId }: Props) => {
  const { school } = useAdminSchoolDetail(schoolId);

  if (!school) {
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

  return <Presenter school={school} />;
};
