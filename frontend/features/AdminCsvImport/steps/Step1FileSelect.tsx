"use client";

import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { colors } from "@/app/theme/colors";
import type { CourseOption, ImportMode, UnitOption } from "../types";
import { buildCourseLabel } from "@/libs/domain/course/courseLabel";

type Props = {
  courses: CourseOption[];
  coursesLoading: boolean;
  units: UnitOption[];
  unitsLoading: boolean;
  courseId: number | null;
  unitId: number | null;
  isPreset: boolean;
  onCourseChange: (courseId: number) => void;
  onUnitChange: (unitId: number) => void;
  file: File | null;
  fileError: string | null;
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
  mode: ImportMode;
  onModeChange: (mode: ImportMode) => void;
  onNext: () => void;
  canProceed: boolean;
  submitting: boolean;
};

export const Step1FileSelect = ({
  courses,
  coursesLoading,
  units,
  unitsLoading,
  courseId,
  unitId,
  isPreset,
  onCourseChange,
  onUnitChange,
  file,
  fileError,
  onFileSelect,
  onFileClear,
  mode,
  onModeChange,
  onNext,
  canProceed,
  submitting,
}: Props) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) onFileSelect(droppedFile);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFileSelect(selected);
    e.target.value = "";
  };

  const presetCourse = courses.find((course) => course.id === courseId);
  const presetUnit = units.find((unit) => unit.id === unitId);
  const presetCourseLabel = presetCourse
    ? buildCourseLabel(presetCourse)
    : `講座 ${courseId}`;
  const presetUnitLabel = presetUnit ? presetUnit.unit_name : `単元 ${unitId}`;

  return (
    <Stack spacing={3}>
      {isPreset ? (
        <Box>
          <Typography variant="body2" sx={{ color: colors.text.muted, mb: 1 }}>
            インポート対象
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip label={`講座: ${presetCourseLabel}`} />
            <Chip label={`単元: ${presetUnitLabel}`} />
          </Stack>
        </Box>
      ) : (
        <Stack direction="row" spacing={2}>
          <TextField
            select
            label="講座"
            fullWidth
            disabled={coursesLoading}
            value={courseId ?? ""}
            onChange={(e) => onCourseChange(Number(e.target.value))}
          >
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {buildCourseLabel(course)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="単元"
            fullWidth
            disabled={courseId == null || unitsLoading}
            value={unitId ?? ""}
            onChange={(e) => onUnitChange(Number(e.target.value))}
          >
            {units.map((unit) => (
              <MenuItem key={unit.id} value={unit.id}>
                {unit.unit_name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      )}

      <Box
        data-testid="csv-dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        sx={{
          border: `2px dashed ${dragActive ? colors.brand.primary : colors.border.light}`,
          borderRadius: 2,
          p: 4,
          textAlign: "center",
          cursor: "pointer",
          bgcolor: dragActive ? colors.surface.light : "transparent",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          hidden
          onChange={handleInputChange}
        />
        <UploadFileOutlinedIcon
          fontSize="large"
          sx={{ color: colors.text.muted }}
        />
        <Typography variant="body2" sx={{ mt: 1 }}>
          CSVファイルをドラッグ&ドロップ、またはクリックして選択
        </Typography>
        <Typography variant="caption" sx={{ color: colors.text.muted }}>
          .csv形式、5MB以内
        </Typography>
      </Box>

      {file && (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2">{file.name}</Typography>
          <Button size="small" onClick={onFileClear}>
            削除
          </Button>
        </Stack>
      )}

      {fileError && <Alert severity="error">{fileError}</Alert>}

      <Box>
        <Typography variant="body2" sx={{ mb: 1 }}>
          インポートモード
        </Typography>
        <RadioGroup
          row
          value={mode}
          onChange={(e) => onModeChange(e.target.value as ImportMode)}
        >
          <FormControlLabel value="append" control={<Radio />} label="追加" />
          <FormControlLabel
            value="overwrite"
            control={<Radio />}
            label="上書き"
          />
        </RadioGroup>
        {mode === "overwrite" && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            既存の問題を全て置き換えます
          </Alert>
        )}
      </Box>

      <Box>
        <Button
          component="a"
          href="/api/admin/csv_template/questions"
          download
          size="small"
        >
          テンプレートをダウンロード
        </Button>
      </Box>

      {coursesLoading && <CircularProgress size={20} />}

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          disabled={!canProceed || submitting}
          onClick={onNext}
          startIcon={
            submitting ? <CircularProgress size={16} color="inherit" /> : null
          }
        >
          次へ
        </Button>
      </Box>
    </Stack>
  );
};
