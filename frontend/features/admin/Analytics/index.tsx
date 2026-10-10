"use client";

import { useFetchAnalytics } from "./hooks/useFetchAnalytics";
import { Presenter } from "./Presenter";

export function Analytics() {
  const analytics = useFetchAnalytics();

  return <Presenter {...analytics} />;
}
