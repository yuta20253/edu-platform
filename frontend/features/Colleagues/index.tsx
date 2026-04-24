"use client";

import { useEffect, useState } from "react";
import { Presenter } from "./Presenter";
import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { TeachersData } from "./types";

export const Colleagues = () => {
  const [data, setData] = useState<TeachersData | null>(null);
  const [page, setPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<TeachersData>("/api/teacher/colleagues")
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [router]);

  if (!data) {
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

  return <Presenter data={data} page={page} onPageChange={setPage} />;
};
