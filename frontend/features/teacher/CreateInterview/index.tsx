"use client";

import { Box, CircularProgress } from "@mui/material";
import { useState } from "react";
import { useCreateInterview } from "./hooks/useCreateInterview";
import { useInitialStudent } from "./hooks/useInitialStudent";
import { useStudentSearch } from "./hooks/useStudentSearch";
import { Presenter } from "./Presenter";

type Props = {
  initialStudentId?: number;
};

export const CreateInterview = ({ initialStudentId }: Props) => {
  const [keyword, setKeyword] = useState("");
  const { options, error, searching } = useStudentSearch(keyword);
  const { student: initialStudent, ready } =
    useInitialStudent(initialStudentId);
  const { onSubmit, submitError } = useCreateInterview();

  // 初期選択の生徒が決まってからフォームを出す(フォームの初期値は後から変えない)
  if (!ready) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Presenter
      studentOptions={options}
      searching={searching}
      searchError={error}
      onKeywordChange={setKeyword}
      initialStudent={initialStudent}
      onSubmit={onSubmit}
      submitError={submitError}
    />
  );
};
