import { Analytics } from "@/features/admin/Analytics";
import { Suspense } from "react";

// フィルタをURLクエリ(useSearchParams)で持つため、Suspenseで包む。
const AnalyticsPage = () => (
  <Suspense>
    <Analytics />
  </Suspense>
);

export default AnalyticsPage;
