import { useState, useMemo, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";
import { apiClient } from "@/libs/http/apiClient";

type Address = {
  id: number;
  city: string;
  town: string;
};

export const useFetchAddresses = () => {
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [townOptions, setTownOptions] = useState<Address[]>([]);

  const fetchCities = useMemo(() => {
    return debounce(async (prefectureId: number) => {
      const res = await apiClient.get<Address[]>("/api/student/addresses", {
        params: {
          prefecture_id: prefectureId,
        },
      });

      const cities = [...new Set(res.data.map((a) => a.city))];

      setCityOptions(cities);
    }, 300);
  }, []);

  const fetchTowns = useMemo(() => {
    return debounce(async (prefectureId: number, city: string) => {
      const res = await apiClient.get<Address[]>("/api/student/addresses", {
        params: {
          prefecture_id: prefectureId,
          city,
        },
      });

      setTownOptions(res.data);
    }, 300);
  }, []);

  const resetTownOptions = useCallback(
    (addresses: Address[]) => {
      fetchTowns.cancel();
      setTownOptions(addresses);
    },
    [fetchTowns],
  );

  useEffect(() => {
    return () => {
      fetchCities.cancel();
      fetchTowns.cancel();
    };
  }, [fetchCities, fetchTowns]);

  return {
    cityOptions,
    townOptions,
    fetchCities,
    fetchTowns,
    resetTownOptions,
    setCityOptions,
    setTownOptions,
  };
};
