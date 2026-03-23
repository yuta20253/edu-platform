import { useMemo, useState } from "react";
import { apiClient } from "@/libs/http/apiClient";

type GradeType = {
  id: number;
  year: number;
  display_name: string;
};

export const useFetchGrades = () => {
  const [grades, setGrades] = useState<GradeType[]>([]);
  const fetchGrades = useMemo(() => {
    return async (highSchoolId: number) => {
      try {
        const res = await apiClient.get<GradeType[]>(
          `/api/v1/high_schools/${highSchoolId}/grades`,
        );

        setGrades(res.data);
      } catch (error) {
        console.error(error);
      }
    };
  }, []);

  return {
    grades,
    setGrades,
    fetchGrades,
  };
};
