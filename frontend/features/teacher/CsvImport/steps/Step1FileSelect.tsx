"use client";

import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { colors } from "@/app/theme/colors";
import { GRADE_DISPLAY_NAMES } from "../constants";

type Props = {
  file: File | null;
  fileError: string | null;
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
  onNext: () => void;
  canProceed: boolean;
  submitting: boolean;
};

export const Step1FileSelect = ({
  file,
  fileError,
  onFileSelect,
  onFileClear,
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

  return (
    <Stack spacing={3}>
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
        <Typography variant="body2" sx={{ color: colors.text.muted, mb: 1 }}>
          列: 氏名・氏名カナ・メール・学年・学級（すべて必須）
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: colors.text.muted, display: "block", mb: 1 }}
        >
          学年は次のいずれかを入力してください: {GRADE_DISPLAY_NAMES.join("、")}
        </Typography>
        <Button
          component="a"
          href="/templates/students_template.csv"
          download
          size="small"
        >
          テンプレートをダウンロード
        </Button>
      </Box>

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
