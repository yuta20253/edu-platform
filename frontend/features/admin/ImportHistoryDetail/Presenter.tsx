"use client";

import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { colors } from "@/app/theme/colors";
import {
  importModeLabel,
  importStatusColor,
  importStatusLabel,
} from "@/constants/import_status";
import { formatDateTime } from "@/libs/ui/formatDate";
import type {
  DetailTabValue,
  ImportHistoryDetailData,
  ImportHistoryDetailRow,
  SnackbarState,
} from "./types";

// 一覧画面と揃えたGentelella風のフラット・ミニマルなテイストのトークン。
// 角丸なし・影なし、薄いグレーのボーダーのみで区切る。
const flat = {
  border: "#E6E9ED",
  headerBg: "#ffffff",
  stripe: "#F7F7F7",
  titleText: "#2A3F54",
  summaryBg: "#FAFBFC",
};

type Props = {
  data: ImportHistoryDetailData;
  activeTab: DetailTabValue;
  exporting: boolean;
  snackbar: SnackbarState;
  onTabChange: (tab: DetailTabValue) => void;
  onExport: () => void;
  onSnackbarClose: () => void;
};

const SummaryItem = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Box sx={{ minWidth: 140 }}>
    <Typography
      variant="caption"
      sx={{ color: colors.text.muted, display: "block", mb: 0.5 }}
    >
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {children}
    </Typography>
  </Box>
);

const RowTable = ({ rows }: { rows: ImportHistoryDetailRow[] }) => {
  if (rows.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        該当するデータがありません
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table
        size="small"
        sx={{
          "& .MuiTableCell-root": {
            borderBottom: `1px solid ${flat.border}`,
          },
        }}
      >
        <TableHead>
          <TableRow sx={{ bgcolor: flat.headerBg }}>
            <TableCell
              align="right"
              sx={{
                fontWeight: 600,
                width: 100,
                borderBottom: `2px solid ${flat.border}`,
              }}
            >
              行番号
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                borderBottom: `2px solid ${flat.border}`,
              }}
            >
              メッセージ
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={`${row.row_number}-${index}`}
              sx={{
                bgcolor: index % 2 === 1 ? flat.stripe : "transparent",
                "&:last-child td": { border: 0 },
              }}
            >
              <TableCell align="right">{row.row_number}</TableCell>
              <TableCell>{row.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const Presenter = ({
  data,
  activeTab,
  exporting,
  snackbar,
  onTabChange,
  onExport,
  onSnackbarClose,
}: Props) => {
  const warnings = data.warnings ?? [];
  const successes = data.successes ?? [];

  const tabRows: Record<DetailTabValue, ImportHistoryDetailRow[]> = {
    errors: data.errors,
    warnings,
    successes,
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* ヘッダー */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
          pb: 1.5,
          borderBottom: `2px solid ${flat.border}`,
        }}
      >
        <IconButton
          component={Link}
          href="/admin/csv-import/history"
          size="small"
          aria-label="インポート履歴一覧へ戻る"
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="h5"
          fontWeight={600}
          sx={{ color: flat.titleText, letterSpacing: 0.3 }}
        >
          インポート履歴詳細
        </Typography>
        <Chip
          label={importStatusLabel[data.status]}
          size="small"
          color={importStatusColor[data.status]}
          variant="filled"
          sx={{
            borderRadius: "3px",
            fontWeight: 600,
            fontSize: "0.7rem",
            color: "#fff",
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          size="small"
          onClick={onExport}
          disabled={exporting}
          startIcon={
            exporting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <FileDownloadIcon fontSize="small" />
            )
          }
          sx={{ borderRadius: "2px", textTransform: "none" }}
        >
          CSVエクスポート
        </Button>
      </Box>

      {/* 実行結果サマリー */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 3,
          mb: 3,
          p: 2,
          bgcolor: flat.summaryBg,
          border: `1px solid ${flat.border}`,
        }}
      >
        <SummaryItem label="コース">
          {data.course?.level_name ?? "-"}
        </SummaryItem>
        <SummaryItem label="単元">{data.unit?.unit_name ?? "-"}</SummaryItem>
        <SummaryItem label="ファイル名">{data.file_name}</SummaryItem>
        <SummaryItem label="件数">{data.total_count}</SummaryItem>
        <SummaryItem label="成功数">{data.success_count}</SummaryItem>
        <SummaryItem label="エラー数">{data.error_count}</SummaryItem>
        <SummaryItem label="モード">{importModeLabel[data.mode]}</SummaryItem>
        <SummaryItem label="実行者">{data.user?.name ?? "-"}</SummaryItem>
        <SummaryItem label="日時">
          {formatDateTime(data.created_at)}
        </SummaryItem>
      </Box>

      {/* タブ */}
      <Box sx={{ borderBottom: `1px solid ${flat.border}`, mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value: DetailTabValue) => onTabChange(value)}
        >
          <Tab label={`エラー (${data.errors.length})`} value="errors" />
          <Tab label={`警告 (${warnings.length})`} value="warnings" />
          <Tab label={`成功 (${successes.length})`} value="successes" />
        </Tabs>
      </Box>

      {/* 行一覧 */}
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${flat.border}`,
          borderRadius: 0,
          boxShadow: "none",
        }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <RowTable rows={tabRows[activeTab]} />
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={onSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={onSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
