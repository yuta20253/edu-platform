"use client";

import { useState, useMemo, useEffect } from "react";
import debounce from "lodash/debounce";
import { apiClient } from "@/libs/http/apiClient";
import type { Address } from "../types";

// 住所カスケード（都道府県→市区町村→町名）の候補取得。
// admin 画面用に /api/admin/addresses を参照する。
export const useFetchAddresses = () => {
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [townOptions, setTownOptions] = useState<Address[]>([]);

  const fetchCities = useMemo(() => {
    return debounce(async (prefectureId: number) => {
      const res = await apiClient.get<Address[]>("/api/admin/addresses", {
        params: { prefecture_id: prefectureId },
      });

      const cities = [...new Set(res.data.map((a) => a.city))];

      setCityOptions(cities);
    }, 300);
  }, []);

  const fetchTowns = useMemo(() => {
    return debounce(async (prefectureId: number, city: string) => {
      const res = await apiClient.get<Address[]>("/api/admin/addresses", {
        params: { prefecture_id: prefectureId, city },
      });

      setTownOptions(res.data);
    }, 300);
  }, []);

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
    setCityOptions,
    setTownOptions,
  };
};
