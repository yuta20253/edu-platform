"use client";

import { useState } from "react";
import { useStudent } from "./hooks";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Presenter } from "./Presenter";
import { StudentDetailTab } from "./types";

type Props = {
  studentId: number;
};

export const StudentDetail = ({ studentId }: Props) => {
  const [tab, setTab] = useState<StudentDetailTab>("profile");
  const [page, setPage] = useState(1);
  const { data, loading, error } = useStudent(studentId, tab, page);

  const handleTabChange = (nextTab: StudentDetailTab) => {
    setTab(nextTab);
    setPage(1);
  };

  // 最初の読み込みの間とその失敗だけ画面全体で出す。
  // タブ切り替え中・切り替え後の失敗は、ヘッダーを残したままPresenterの中で出す
  if (!data) {
    if (error) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            データの取得に失敗しました
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Presenter
      tab={tab}
      data={data}
      loading={loading}
      error={error}
      page={page}
      onTabChange={handleTabChange}
      onPageChange={setPage}
    />
  );
};
