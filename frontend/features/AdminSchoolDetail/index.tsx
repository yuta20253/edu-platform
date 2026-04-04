"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { apiClient } from "@/libs/http/apiClient";
import { Presenter } from "./Presenter";
import type { AdminSchoolDetail } from "./types";

type Props = {
  schoolId: number;
};

export const AdminSchoolDetail = ({ schoolId }: Props) => {
  const [school, setSchool] = useState<AdminSchoolDetail | null>(null);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<AdminSchoolDetail>(`/api/admin/schools/${schoolId}`)
      .then((res) => setSchool(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [schoolId, router]);

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
