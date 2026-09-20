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
import { subjectLists } from "../../CreateTask/constants";
import { needsCourse, needsUnit } from "../selectionRequirements";
import { AnalyticsType } from "../types";

const typeLabels: Record<AnalyticsType, string> = {
  task_completion: "タスク達成率",
  understanding_score: "理解度スコア",
  grade_average: "学年平均との比較",
  course_rank: "コース内順位",
  unit_rank: "単元内順位",
};

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
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel id="analytics-type-label">表示切替</InputLabel>
        <Select
          labelId="analytics-type-label"
          label="表示切替"
          value={type}
          onChange={(e: SelectChangeEvent) =>
            setType(e.target.value as AnalyticsType)
          }
        >
          {Object.entries(typeLabels).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {needsCourse(type) && (
        <FormControl sx={{ minWidth: 160 }}>
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
      )}

      {needsCourse(type) && courses !== null && (
        <FormControl sx={{ minWidth: 160 }}>
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

      {needsUnit(type) && courseId !== null && (
        <FormControl sx={{ minWidth: 160 }}>
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
