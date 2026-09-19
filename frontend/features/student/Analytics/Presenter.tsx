"use client";

import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { Course } from "@/types/tasks/course";
import { Unit } from "@/types/tasks/unit";
import { SubjectName } from "@/constants/subject";
import { subjectLists } from "../CreateTask/constants";
import { TaskCompletionChart } from "./components/TaskCompletionChart";
import { UnderstandingScoreChart } from "./components/UnderstandingScoreChart";
import { GradeAverageChart } from "./components/GradeAverageChart";
import { RankChart } from "./components/RankChart";
import {
  AnalyticsDataMap,
  AnalyticsType,
  GradeAverageData,
  RankData,
  TaskCompletionData,
  UnderstandingScoreData,
} from "./types";

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
  data: AnalyticsDataMap[AnalyticsType] | null;
  loading: boolean;
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
  data,
  loading,
}: Props) => {
  const needsCourse = type === "course_rank" || type === "unit_rank";
  const needsUnit = type === "unit_rank";

  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: "auto" }}>
      <Typography
        variant="h4"
        component="p"
        sx={{ fontWeight: "bold", my: 4, textAlign: "center" }}
      >
        学習分析
      </Typography>

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

        {needsCourse && (
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

        {needsCourse && courses !== null && (
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

        {needsUnit && courseId !== null && (
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

      <Box sx={{ minHeight: 240 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 240,
            }}
          >
            <CircularProgress />
          </Box>
        ) : data === null ? (
          <Typography sx={{ textAlign: "center", py: 4 }}>
            {needsUnit && (courseId === null || unitId === null)
              ? "コースと単元を選択してください"
              : needsCourse && courseId === null
                ? "教科とコースを選択してください"
                : "データがありません"}
          </Typography>
        ) : type === "task_completion" ? (
          <TaskCompletionChart data={data as TaskCompletionData} />
        ) : type === "understanding_score" ? (
          <UnderstandingScoreChart data={data as UnderstandingScoreData} />
        ) : type === "grade_average" ? (
          <GradeAverageChart data={data as GradeAverageData} />
        ) : (
          <RankChart data={data as RankData} />
        )}
      </Box>
    </Box>
  );
};
