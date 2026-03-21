import { apiClient } from "@/libs/http/apiClient";
import { useEffect, useState } from "react";

type PrefectureType = {
  id: number;
  name: string;
};

export const useFetchPrefectures = () => {
  const [prefectures, setPrefectures] = useState<PrefectureType[]>([]);

  useEffect(() => {
    const fetchPrefectures = async () => {
      try {
        const res = await apiClient.get(`/api/auth/prefectures`);

        setPrefectures(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchPrefectures();
  }, []);

  return {
    prefectures,
  };
};
