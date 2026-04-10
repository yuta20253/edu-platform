"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Goal } from "./types";
import { Box, CircularProgress } from "@mui/material";
import { Presenter } from "./presenter";

export const Goals = () => {
  const [data, setData] = useState<Goal[]>([]);
  const [page, setPage] = useState<number>(1);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<Goal[]>("api/student/goals")
      .then((res) => {
        console.log(res);
        setData(res.data);
      })
      .catch((err) => {
        if (err.response.status === 401) {
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
