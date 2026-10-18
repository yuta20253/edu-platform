import { Analytics } from "@features/student/Analytics";
import { Suspense } from "react";

// 期間をURLクエリ(useSearchParams)で持つため、Suspenseで包む。
export default function AnalyticsPage() {
  return (
    <Suspense>
      <Analytics />
    </Suspense>
  );
}
