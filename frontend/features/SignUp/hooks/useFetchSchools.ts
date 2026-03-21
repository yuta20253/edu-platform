import { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";
import { apiClient } from "@/libs/http/apiClient";
import { HighSchoolType } from "../types";

export const useFetchSchools = () => {
  const [highSchools, setHighSchools] = useState<HighSchoolType[]>([]);
  const fetchSchools = useMemo(() => {
    const fn = debounce(async (keyword: string, prefectureId: number) => {
      if (!prefectureId) return;
      try {
        const res = await apiClient.get<HighSchoolType[]>(
          "/api/auth/high-schools",
          {
            params: {
              keyword,
              prefectureId,
            },
          },
        );

        setHighSchools(res.data);
      } catch (error) {
        console.error(error);
      }
    }, 300);
    return fn;
  }, []);

  useEffect(() => {
    return () => {
      fetchSchools.cancel();
    };
  }, [fetchSchools]);

  return {
    highSchools,
    setHighSchools,
    fetchSchools,
  };
};
