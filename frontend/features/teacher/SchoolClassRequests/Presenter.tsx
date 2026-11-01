"use client";

import { colors } from "@/app/theme/colors";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  schoolClassRequestActionLabel,
  schoolClassRequestStatusDefinitions,
  schoolClassRequestStatuses,
} from "@/constants/school_class_request";
import { formatDateTime } from "@/libs/ui/formatDate";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Card,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import Link from "next/link";
import {
  SchoolClassRequestsData,
  SchoolClassRequestStatusFilter,
} from "./types";

type Props = {
  data: SchoolClassRequestsData;
  page: number;
  onPageChange: (page: number) => void;
  status: SchoolClassRequestStatusFilter;
  onStatusChange: (status: SchoolClassRequestStatusFilter) => void;
};

const filters: { value: SchoolClassRequestStatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  ...schoolClassRequestStatuses.map((s) => ({
    value: s,
    label: schoolClassRequestStatusDefinitions[s].label,
  })),
];

export const Presenter = ({
  data,
  page,
  onPageChange,
  status,
  onStatusChange,
}: Props) => {
  const { school_class_requests: requests, meta } = data;

  return (
    <Box sx={{ p: 3, width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Typography
          variant="h5"
          component="h1"
          fontWeight={700}
          sx={{ color: colors.text.primary }}
        >
          学級申請
        </Typography>

        <Typography variant="body2" sx={{ color: colors.text.muted }}>
          {meta.total_count}件
        </Typography>

        <Button
          component={Link}
          href="/teacher/school-class-requests/new"
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          sx={{ ml: "auto", textTransform: "none", fontWeight: 600 }}
        >
          申請する
        </Button>
      </Box>

      <ToggleButtonGroup
        exclusive
        size="small"
        value={status}
        onChange={(_, value: SchoolClassRequestStatusFilter | null) => {
          if (value) onStatusChange(value);
        }}
        aria-label="ステータスで絞り込み"
        sx={{ mb: 2, flexWrap: "wrap" }}
      >
        {filters.map((f) => (
          <ToggleButton
            key={f.value}
            value={f.value}
            sx={{ px: 2, fontWeight: 600 }}
          >
            {f.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {requests.length === 0 ? (
        <EmptyState message="学級申請はありません" />
      ) : (
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${colors.border.light}`,
            borderRadius: 2,
            overflow: "hidden",
            mb: 3,
          }}
        >
          <TableContainer>
            <Table
              size="small"
              sx={{
                minWidth: 880,
                "& th, & td": { py: 1.5, px: 2, verticalAlign: "middle" },
              }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: colors.surface.light,
                    "& th": { fontWeight: 700, color: colors.text.primary },
                  }}
                >
                  <TableCell>申請日時</TableCell>
                  <TableCell>種別</TableCell>
                  <TableCell>学年</TableCell>
                  <TableCell>対象クラス</TableCell>
                  <TableCell>新しいクラス名</TableCell>
                  <TableCell>申請者</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell align="center">詳細</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {requests.map((request) => (
                  <TableRow
                    key={request.id}
                    hover
                    sx={{ "&:last-child td": { borderBottom: 0 } }}
                  >
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDateTime(request.created_at)}
                    </TableCell>
                    <TableCell>
                      {schoolClassRequestActionLabel[request.action]}
                    </TableCell>
                    <TableCell>{request.grade.display_name}</TableCell>
                    {/* 新設の申請と、承認後に削除されたクラスは対象クラスが無い */}
                    <TableCell>{request.school_class?.name ?? "-"}</TableCell>
                    {/* 削除の申請には新しいクラス名が無い */}
                    <TableCell sx={{ fontWeight: 600 }}>
                      {request.name ?? "-"}
                    </TableCell>
                    <TableCell>{request.applicant.name}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={request.status}
                        definitions={schoolClassRequestStatusDefinitions}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        component={Link}
                        href={`/teacher/school-class-requests/${request.id}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          minWidth: 64,
                          height: 28,
                          fontSize: "0.75rem",
                          textTransform: "none",
                        }}
                      >
                        詳細
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {meta.total_pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={meta.total_pages}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
};
