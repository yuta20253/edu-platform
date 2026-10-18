"use client";

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { Course } from "@/types/tasks/course";
import { Unit } from "@/types/tasks/unit";
import { SubjectName } from "@/constants/subject";
import { subjectLists } from "@/constants/subject";
import { RankType } from "../types";

const typeLabels: Record<RankType, string> = {
  course_rank: "コース内順位",
  unit_rank: "単元内順位",
};

type Props = {
  type: RankType;
  setType: (type: RankType) => void;
  subject: SubjectName | null;
  setSubject: (subject: SubjectName) => void;
  courseId: number | null;
  setCourseId: (courseId: number) => void;
  unitId: number | null;
  setUnitId: (unitId: number) => void;
  courses: Course[] | null;
  units: Unit[];
};

export const AnalyticsFilters = ({
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
}: Props) => {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel id="analytics-type-label">順位の種類</InputLabel>
        <Select
          labelId="analytics-type-label"
          label="順位の種類"
          value={type}
          onChange={(e: SelectChangeEvent) =>
            setType(e.target.value as RankType)
          }
        >
          {Object.entries(typeLabels).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="analytics-subject-label">教科</InputLabel>
        <Select
          labelId="analytics-subject-label"
          label="教科"
          value={subject ?? ""}
          onChange={(e: SelectChangeEvent) =>
            setSubject(e.target.value as SubjectName)
          }
        >
          {subjectLists.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {subject !== null && courses !== null && (
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="analytics-course-label">コース</InputLabel>
          <Select
            labelId="analytics-course-label"
            label="コース"
            value={courseId ?? ""}
            onChange={(e: SelectChangeEvent<number | string>) =>
              setCourseId(Number(e.target.value))
            }
          >
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.level_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {type === "unit_rank" && courseId !== null && (
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="analytics-unit-label">単元</InputLabel>
          <Select
            labelId="analytics-unit-label"
            label="単元"
            value={unitId ?? ""}
            onChange={(e: SelectChangeEvent<number | string>) =>
              setUnitId(Number(e.target.value))
            }
          >
            {units.map((unit) => (
              <MenuItem key={unit.id} value={unit.id}>
                {unit.unit_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
};
