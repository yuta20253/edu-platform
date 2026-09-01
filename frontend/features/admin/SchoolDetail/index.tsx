"use client";

import { Box, CircularProgress } from "@mui/material";
import { Presenter } from "./Presenter";
import { useSchoolDetail } from "./hooks";

type Props = {
  schoolId: number;
};

export const SchoolDetail = ({ schoolId }: Props) => {
  const { school } = useSchoolDetail(schoolId);

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
