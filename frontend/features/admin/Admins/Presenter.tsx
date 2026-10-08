"use client";

import { colors } from "@/app/theme/colors";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Alert,
  Avatar,
  Box,
  Button,
  IconButton,
  Stack,
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
import { format } from "date-fns";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { TableCard } from "@/components/ui/TableCard";
import { AdminCreateDrawer } from "./components/AdminCreateDrawer";
import type { AdminsData, CreateAdminInput } from "./types";

type Props = {
  data: AdminsData;
  page: number;
  query: string;
  onQueryChange: (query: string) => void;
  onPageChange: (page: number) => void;
  drawerOpen: boolean;
  onAddClick: () => void;
  onDrawerClose: () => void;
  onCreate: (input: CreateAdminInput) => void;
  creating: boolean;
  createErrors: string[];
};

export const Presenter = ({
  data,
  page,
  query,
  onQueryChange,
  onPageChange,
  drawerOpen,
  onAddClick,
  onDrawerClose,
  onCreate,
  creating,
  createErrors,
}: Props) => {
  const { admins, meta } = data;

  return (
    <Box sx={{ p: 3 }}>
      {/* ヘッダー：タイトル・件数と「管理者を追加」ボタン */}
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
            管理者一覧
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.muted }}>
            {meta.total_count} 件
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={onAddClick}
        >
          管理者を追加
        </Button>
      </Box>

      {/* RBAC バナー（issue 要件） */}
      <Alert severity="info" sx={{ mb: 3 }}>
        現在、全管理者は同等権限です。将来的に
        RBAC（ロールベースアクセス制御）を追加予定です。
      </Alert>

      {/* 検索 */}
      <Box sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="名前・メールで検索"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          sx={{ minWidth: 280 }}
        />
      </Box>

      {/* テーブル */}
      <TableCard>
        {admins.length === 0 ? (
          <EmptyState message="管理者が見つかりません" />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: colors.surface.light }}>
                  <TableCell sx={{ fontWeight: 600 }}>名前</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>メールアドレス</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>登録日</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    詳細
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow
                    key={admin.id}
                    hover
                    sx={{ "&:last-child td": { border: 0 } }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: "0.875rem",
                            bgcolor: colors.brand.primary,
                          }}
                        >
                          {admin.name.charAt(0)}
                        </Avatar>
                        <span>{admin.name}</span>
                      </Stack>
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      {format(new Date(admin.created_at), "yyyy/MM/dd")}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="詳細">
                        <IconButton
                          component={Link}
                          href={`/admin/admins/${admin.id}`}
                          size="small"
                          aria-label={`${admin.name}の詳細`}
                        >
                          <ChevronRightIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TableCard>

      {/* ページネーション */}
      <PaginationBar
        totalPages={meta.total_pages}
        page={page}
        onChange={onPageChange}
      />

      {/* 管理者を追加ドロワー */}
      <AdminCreateDrawer
        open={drawerOpen}
        onClose={onDrawerClose}
        onCreate={onCreate}
        creating={creating}
        createErrors={createErrors}
      />
    </Box>
  );
};
