"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import type { UnitOption } from "../types";

type CourseDetailResponse = {
  id: number;
  units: Array<{ id: number; unit_name: string; questions_count: number }>;
};

export const useFetchUnitOptions = (courseId: number | null) => {
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [unitsLoading, setUnitsLoading] = useState<boolean>(false);
  const [unitsError, setUnitsError] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (courseId == null) {
      setUnits((prev) => (prev.length === 0 ? prev : []));
      setUnitsError(false);
      return;
    }

    const controller = new AbortController();
    setUnitsLoading(true);
    setUnitsError(false);

    apiClient
      .get<CourseDetailResponse>(`/api/admin/courses/${courseId}`, {
        signal: controller.signal,
      })
      .then((res) => {
        setUnits(
          res.data.units.map((unit) => ({
            id: unit.id,
            unit_name: unit.unit_name,
          })),
        );
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (extractApiError(err).status === 401) {
          router.push("/login");
          return;
        }
        setUnits([]);
        setUnitsError(true);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setUnitsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [courseId, router, reloadKey]);

  const retryUnits = () => setReloadKey((prev) => prev + 1);

  return { units, unitsLoading, unitsError, retryUnits };
};
