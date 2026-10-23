"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { PermissionsData } from "../types";

export const useFetchPermissions = () => {
  const [page, setPage] = useState(1);
  const { data, error, refetch } = useApiQuery<PermissionsData>(
    "/api/teacher/permissions",
    { params: { page: String(page) } },
  );

  return { data, error, page, setPage, refetch };
};
