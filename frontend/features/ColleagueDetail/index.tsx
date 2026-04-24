"use client";

import { apiClient } from "@/libs/http/apiClient";
import { Box, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Presenter } from "./Presenter";
import { GenderType } from "./types";

type Teacher = {
  id: number;
  name: string;
  name_kana: string;
  grade: {
    year: number;
    display_name: string;
  };
  teacher_permission: {
    id: number;
    grade_scope: number;
    manage_other_teachers: boolean;
  };
  user_personal_info?: {
    id: number;
    phone_number: string;
    birthday: string;
    gender: GenderType;
  };
  address?: {
    id: number;
    postal_code: string;
    city: string;
    town: string;
    street_address: string;
    prefecture: {
      id: number;
      name: string;
    };
  };
};

type Props = {
    colleagueId: number;
};

export const ColleagueDetail = ({ colleagueId }: Props) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<Teacher>(`/api/teacher/colleagues/${colleagueId}`)
      .then((res) => setTeacher(res.data))
      .catch((err) => {
        if (err.response.status === 401) {
          router.push("/login");
        }
      })
  }, [colleagueId, router])

  if (!teacher) {
    return (
      <Box sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
       }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Presenter teacher={teacher} />
  );
};
