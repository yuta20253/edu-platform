"use client";

import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { colors } from "@/app/theme/colors";
import { useState } from "react";
import { useCourseAssignments } from "../hooks/useCourseAssignments";
import { useFetchCourseOptions } from "../hooks/useFetchCourseOptions";

type Props = {
  schoolId: number;
};

export const CourseAssignmentsTab = ({ schoolId }: Props) => {
  const { assignments, loading, mutationErrors, handleAssign, handleUnassign } =
    useCourseAssignments(schoolId);
  const { courseOptions } = useFetchCourseOptions();
  const [assigning, setAssigning] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");

  const assignedCourseIds = new Set(assignments.map((a) => a.course.id));
  const availableCourses = courseOptions.filter(
    (course) => !assignedCourseIds.has(course.id),
  );

  const handleAssignSubmit = async () => {
    if (selectedCourseId === "") return;
    await handleAssign(selectedCourseId);
    setSelectedCourseId("");
    setAssigning(false);
  };

  if (loading) {
    return null;
  }

  return (
    <Box>
      {mutationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {mutationErrors.join(" ")}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" onClick={() => setAssigning(true)}>
          コースを割り当てる
        </Button>
      </Box>

      {assigning && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <TextField
            select
            label="コース"
            value={selectedCourseId}
            onChange={(event) =>
              setSelectedCourseId(Number(event.target.value))
            }
            sx={{ minWidth: 240 }}
          >
            {availableCourses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.subject?.name} {course.level_name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={handleAssignSubmit}>
            割り当てる
          </Button>
          <Button color="inherit" onClick={() => setAssigning(false)}>
            キャンセル
          </Button>
        </Stack>
      )}

      {assignments.length === 0 ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="body1" sx={{ color: colors.text.secondary }}>
            コースが割り当てられていません
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {assignments.map((assignment) => (
            <Box
              key={assignment.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                border: `1px solid ${colors.border.light}`,
                borderRadius: 1,
              }}
            >
              <Typography>
                {assignment.course.subject?.name} {assignment.course.level_name}
              </Typography>
              <Button
                size="small"
                color="error"
                onClick={() => handleUnassign(assignment.course.id)}
              >
                解除
              </Button>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};
