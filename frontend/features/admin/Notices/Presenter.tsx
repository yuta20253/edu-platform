"use client";

import { colors } from "@/app/theme/colors";
import {
  announcementStatusColor,
  announcementStatusLabel,
} from "@/constants/announcement_status";
import { formatDateTime } from "@/libs/ui/formatDate";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import type { Notice, NoticesData, NoticeStatus } from "./types";

type Props = {
  data: NoticesData;
  page: number;
  query: string;
  status: NoticeStatus | "";
  onQueryChange: (query: string) => void;
  onStatusChange: (status: NoticeStatus | "") => void;
  onPageChange: (page: number) => void;
};

const STATUS_OPTIONS: { value: NoticeStatus; label: string }[] = [
  { value: "draft", label: announcementStatusLabel.draft },
  { value: "scheduled", label: announcementStatusLabel.scheduled },
  { value: "published", label: announcementStatusLabel.published },
];

// draft/scheduledのみ編集可能（publishedは配信済みのため編集不可）
const isEditable = (status: NoticeStatus) =>
  status === "draft" || status === "scheduled";

// 配信日時列: publishedはpublished_at、scheduledはscheduled_at、
// draftはどちらもnullなのでformatDateTimeが"-"を返す
const deliveredAt = (notice: Notice) =>
  formatDateTime(notice.published_at ?? notice.scheduled_at);

export const Presenter = ({
  data,
  page,
  query,
  status,
  onQueryChange,
  onStatusChange,
  onPageChange,
}: Props) => {
  const { announcements, meta } = data;

  return (
    <Box sx={{ p: 3 }}>
      {/* ヘッダー：タイトル・件数と「新規作成」ボタン */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: colors.text.primary }}
          >
            お知らせ一覧
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.muted }}>
            {meta.total_count} 件
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/notices/new"
        >
          新規作成
        </Button>
      </Box>

      {/* 検索・フィルタ */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 3 }}>
        <TextField
          size="small"
          placeholder="タイトルで検索"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          sx={{ minWidth: 280 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="notice-status-label">ステータス</InputLabel>
          <Select
            labelId="notice-status-label"
            label="ステータス"
            value={status}
            onChange={(e) =>
              onStatusChange(e.target.value as NoticeStatus | "")
            }
            endAdornment={
              status && (
                <InputAdornment position="end" sx={{ mr: 2 }}>
                  <IconButton
                    aria-label="ステータスをクリア"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange("");
                    }}
                  >
                    <ClearIcon fontSize="inherit" />
                  </IconButton>
                </InputAdornment>
              )
            }
          >
            <MenuItem value="">すべて</MenuItem>
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* テーブル */}
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {announcements.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ py: 4, textAlign: "center" }}
            >
              お知らせが見つかりません
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.surface.light }}>
                    <TableCell sx={{ fontWeight: 600 }}>タイトル</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>配信対象</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>配信日時</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>作成者</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ステータス</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      編集
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {announcements.map((notice) => (
                    <TableRow
                      key={notice.id}
                      hover
                      sx={{ "&:last-child td": { border: 0 } }}
                    >
                      <TableCell>{notice.title}</TableCell>
                      {/* 配信対象はAPIの値を見ず常に固定表示（管理者は全ユーザー配信のみ） */}
                      <TableCell>全ユーザー</TableCell>
                      <TableCell>{deliveredAt(notice)}</TableCell>
                      <TableCell>{notice.publisher.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={announcementStatusLabel[notice.status]}
                          size="small"
                          color={announcementStatusColor[notice.status]}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {isEditable(notice.status) && (
                          <Tooltip title="編集">
                            <IconButton
                              component={Link}
                              href={`/admin/notices/${notice.id}/edit`}
                              size="small"
                              aria-label={`${notice.title}を編集`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ページネーション */}
      {meta.total_pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination
            count={meta.total_pages}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};
