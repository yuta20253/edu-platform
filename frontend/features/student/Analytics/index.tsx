"use client";

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
        data={data}
        courseId={courseId}
        unitId={unitId}
        loading={loading}
        error={error}
      />
    </Presenter>
  );
};
