"use client";

import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";
import { Course } from "@/types/tasks/course";
import { Unit } from "@/types/tasks/unit";
import { SubjectName } from "@/constants/subject";
import { AnalyticsFilters } from "./components/AnalyticsFilters";
import { AnalyticsType } from "./types";

type Props = {
  type: AnalyticsType;
  setType: (type: AnalyticsType) => void;
  subject: SubjectName | null;
  setSubject: (subject: SubjectName) => void;
  courseId: number | null;
  setCourseId: (courseId: number) => void;
  unitId: number | null;
  setUnitId: (unitId: number) => void;
  courses: Course[] | null;
  units: Unit[];
  children: ReactNode;
};

export const Presenter = ({
  type,
  setType,
  subject,
  setSubject,
  courseId,
  setCourseId,
  unitId,
  setUnitId,
  courses,
  units,
  children,
}: Props) => {
  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: "auto" }}>
      <Typography
        variant="h4"
        component="p"
        sx={{ fontWeight: "bold", my: 4, textAlign: "center" }}
      >
        学習分析
      </Typography>

      <AnalyticsFilters
        type={type}
        setType={setType}
        subject={subject}
        setSubject={setSubject}
        courseId={courseId}
        setCourseId={setCourseId}
        unitId={unitId}
        setUnitId={setUnitId}
        courses={courses}
        units={units}
      />

      <Box sx={{ minHeight: 240 }}>{children}</Box>
    </Box>
  );
};
