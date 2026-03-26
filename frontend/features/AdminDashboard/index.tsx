"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { apiClient } from "@/libs/http/apiClient";
import { Presenter } from "./Presenter";
import type { AdminDashboardData } from "./types";

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<AdminDashboardData>("/api/admin/dashboard")
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

  return <Presenter data={data} />;
}
