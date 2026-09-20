"use client";

import { Box, CircularProgress } from "@mui/material";
import { Presenter } from "./Presenter";
import { useAnalytics } from "./hooks/useAnalytics";
import { AnalyticsContent } from "./components/AnalyticsContent";

export const Analytics = () => {
  const {
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
    error,
  } = useAnalytics();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
        データの取得に失敗しました
      </Box>
    );
  }

  return (
    <Presenter
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
    >
      <AnalyticsContent
        type={type}
        result={data}
        courseId={courseId}
        unitId={unitId}
      />
    </Presenter>
  );
};
