"use client";

import { useStudent } from "./hooks";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Presenter } from "./Presenter";

type Props = {
  studentId: number;
};

export const StudentDetail = ({ studentId }: Props) => {
  const { student, loading, error } = useStudent(studentId);

  if (loading) {
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

  if (error || !student) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          データの取得に失敗しました
        </Typography>
      </Box>
    );
  }

  return <Presenter student={student} />;
};
