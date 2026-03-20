import { useMemo, useState } from "react";
import debounce from "lodash/debounce";
import { apiClient } from "@/libs/http/apiClient";

type HighSchoolType = {
  id: number;
  name: string;
};

export const useFetchSchools = () => {
  const [highSchools, setHighSchools] = useState<HighSchoolType[]>([]);
  const fetchSchools = useMemo(() => {
    return debounce(async (keyword: string) => {
      if (keyword.length < 2) return;
      try {
        const res = await apiClient.get<HighSchoolType[]>(
          `/api/auth/high-schools?keyword=${keyword}`,
        );

        setHighSchools(res.data);
      } catch (error) {
        console.error(error);
      }
    }, 300);
  }, []);

  return {
    highSchools,
    fetchSchools,
  };
};
