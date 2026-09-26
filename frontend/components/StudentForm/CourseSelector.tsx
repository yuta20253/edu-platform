"use client";

import { SubjectName, subjectLists } from "@/constants/subject";
import { Course } from "@/types/tasks/course";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Dispatch, SetStateAction } from "react";
import { FormLabel, FormSection } from ".";

type Props = {
  courses: Course[] | null;
  displayedCourses: Course[] | null | undefined;
  selectedCourse: Course | null;
  selectedCourseId: number | null;
  showAllCourses: boolean;
  fetchCourse: (name: SubjectName) => Promise<void>;
  setSelectedCourseId: (value: number) => void;
  setShowAllCourses: Dispatch<SetStateAction<boolean>>;
  selectedUnitIds: number[];
  handleToggleUnit: (unitId: number) => void;
  /** 学習開始済みの単元(編集時のみ。チェックを外せなくする) */
  startedUnitIds?: ReadonlySet<number>;
};

/** タスク作成・編集で共通の「講座を選択」「講座詳細」セクション */
export const CourseSelector = ({
  courses,
  displayedCourses,
  selectedCourse,
  selectedCourseId,
  showAllCourses,
  fetchCourse,
  setSelectedCourseId,
  setShowAllCourses,
  selectedUnitIds,
  handleToggleUnit,
  startedUnitIds,
}: Props): React.JSX.Element => (
  <>
    <FormSection title="講座を選択">
      <FormLabel id="course-subject-label">教科選択</FormLabel>
      <TextField
        select
        fullWidth
        defaultValue=""
        onChange={(e) => fetchCourse(e.target.value as SubjectName)}
        slotProps={{
          select: {
            labelId: "course-subject-label",
            MenuProps: {
              PaperProps: {
                sx: {
                  maxHeight: 48 * 4,
                },
              },
            },
          },
        }}
      >
        <MenuItem value="">選択してください</MenuItem>
        {subjectLists.map((subject) => (
          <MenuItem key={subject} value={subject}>
            {subject}
          </MenuItem>
        ))}
      </TextField>

      <Box sx={{ mt: 3 }}>
        <FormLabel>講座一覧</FormLabel>
        {displayedCourses?.map((course) => (
          <Card variant="outlined" sx={{ mt: 1.5 }} key={course.id}>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                {course.level_name}レベル{course.level_number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {course.description ?? "説明はありません"}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => setSelectedCourseId(course.id)}
              >
                詳細を見る
              </Button>
            </CardActions>
          </Card>
        ))}
        {courses && courses.length > 3 && (
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Button onClick={() => setShowAllCourses((prev) => !prev)}>
              {showAllCourses ? "閉じる" : "もっと見る"}
            </Button>
          </Box>
        )}
      </Box>
    </FormSection>

    {selectedCourseId && (
      <FormSection title="講座詳細">
        <Typography variant="h6" gutterBottom>
          {selectedCourse?.level_name}レベル
          {selectedCourse?.level_number}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {selectedCourse?.description ?? "説明はありません"}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
          単元一覧
        </Typography>
        {selectedCourse?.units.map((unit) => {
          const started = startedUnitIds?.has(unit.id) ?? false;
          return (
            <FormControlLabel
              key={unit.id}
              control={
                <Checkbox
                  checked={selectedUnitIds.includes(unit.id)}
                  disabled={started}
                  onChange={() => handleToggleUnit(unit.id)}
                />
              }
              label={`${unit.unit_name}${started ? "（学習開始済み）" : ""}`}
              sx={{ display: "block" }}
            />
          );
        })}
      </FormSection>
    )}
  </>
);
