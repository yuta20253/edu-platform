"use client";

import { colors } from "@/app/theme/colors";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Pagination,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { AdminCreateDrawer } from "./components/AdminCreateDrawer";
import type { AdminsData, CreateAdminInput } from "./types";

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

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
  snackbar: SnackbarState;
  onSnackbarClose: () => void;
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
  snackbar,
  onSnackbarClose,
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
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {admins.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ py: 4, textAlign: "center" }}
            >
              管理者が見つかりません
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.surface.light }}>
                    <TableCell sx={{ fontWeight: 600 }}>名前</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      メールアドレス
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>登録日</TableCell>
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
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1.5}
                        >
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

      {/* 管理者を追加ドロワー */}
      <AdminCreateDrawer
        open={drawerOpen}
        onClose={onDrawerClose}
        onCreate={onCreate}
        creating={creating}
        createErrors={createErrors}
      />

      {/* 成功・失敗のスナックバー */}
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
