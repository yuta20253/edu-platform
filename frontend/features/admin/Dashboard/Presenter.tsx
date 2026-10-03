"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  StatusBadge,
  type StatusBadgeDefinition,
} from "@/components/ui/StatusBadge";
import { importStatusLabel } from "@/constants/import_status";
import type { ImportStatus } from "@/types/common/import_history";
import { KpiCards } from "./KpiCards";
import { RecentAnnouncements } from "./RecentAnnouncements";
import type { DashboardData } from "./types";

type Props = {
  data: DashboardData;
};

// 色はダッシュボード固有の表現。ラベルは共通の importStatusLabel を使う。
// constants/import_status.tsのimportStatusDefinitions（MUIのcolor
// キーワード版）とは別物なので名前を変えて衝突を避ける。
const dashboardImportStatusDefinitions: Record<
  ImportStatus,
  StatusBadgeDefinition
> = {
  completed: {
    label: importStatusLabel.completed,
    color: colors.status.success,
  },
  failed: { label: importStatusLabel.failed, color: colors.status.error },
  processing: {
    label: importStatusLabel.processing,
    color: colors.status.info,
  },
  pending: { label: importStatusLabel.pending, color: colors.status.pending },
};

export const Presenter = ({ data }: Props) => {
  const { stats, recent_imports, recent_announcements, meta } = data;

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ mb: 3, color: colors.text.primary }}
      >
        ダッシュボード
      </Typography>

      <KpiCards
        stats={stats}
        activeStudentPeriodDays={meta.active_student_period_days}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 3,
          // グリッドトラックは既定でmin-width:autoのため、noWrapする
          // お知らせタイトルの内容幅に1fr列が引っ張られ、2fr:1frの比率が
          // 崩れる。minWidth:0で内容幅を無視させ、意図した比率を守る。
          "& > *": { minWidth: 0 },
        }}
      >
        {/* CSVインポート履歴 */}
        <Card
          elevation={0}
          sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography fontWeight={600}>最近のCSVインポート</Typography>
              <Typography
                component={Link}
                href="/admin/csv-import/history"
                variant="body2"
                sx={{ color: colors.brand.primary, textDecoration: "none" }}
              >
                すべて見る
              </Typography>
            </Box>
            {recent_imports.length === 0 ? (
              <Box sx={{ py: 3, textAlign: "center" }}>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  まだCSVインポートを実行していません
                </Typography>
                <Button
                  variant="outlined"
                  component={Link}
                  href="/admin/csv-import"
                >
                  CSVインポートを実行する
                </Button>
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>実行日時</TableCell>
                      <TableCell>ファイル名</TableCell>
                      <TableCell>件数</TableCell>
                      <TableCell>ステータス</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recent_imports.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {format(
                            new Date(item.created_at),
                            "yyyy/MM/dd HH:mm",
                            { locale: ja },
                          )}
                        </TableCell>
                        <TableCell
                          sx={{
                            maxWidth: 180,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.file_name}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {item.success_count} / {item.total_count} 件
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={item.status}
                            definitions={dashboardImportStatusDefinitions}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <RecentAnnouncements announcements={recent_announcements} />

          {/* クイックアクション */}
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${colors.border.light}`,
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Typography fontWeight={600} sx={{ mb: 2 }}>
                クイックアクション
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  component={Link}
                  href="/admin/csv-import"
                  sx={{ justifyContent: "flex-start" }}
                >
                  CSVインポートを実行する
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  component={Link}
                  href="/admin/notices/new"
                  sx={{ justifyContent: "flex-start" }}
                >
                  お知らせを作成する
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  component={Link}
                  href="/admin/admins/new"
                  sx={{ justifyContent: "flex-start" }}
                >
                  管理者を追加する
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};
