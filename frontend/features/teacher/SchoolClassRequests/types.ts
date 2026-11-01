import type { PaginationMeta } from "@/types/common/pagination";
import type {
  SchoolClassRequest,
  SchoolClassRequestStatus,
} from "@/types/schoolClassRequest/schoolClassRequest";

export type SchoolClassRequestsData = {
  school_class_requests: SchoolClassRequest[];
  meta: PaginationMeta;
};

/** "all" は status 未指定(全ステータス) */
export type SchoolClassRequestStatusFilter = "all" | SchoolClassRequestStatus;
