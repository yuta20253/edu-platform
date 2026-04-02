"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  type SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import type { AdminSchoolsData } from "./types";

type Prefecture = {
  id: number;
  name: string;
};

type Props = {
  data: AdminSchoolsData;
  prefectures: Prefecture[];
  selectedPrefectureId: number | null;
  page: number;
  onPrefectureChange: (id: number | null) => void;
  onPageChange: (page: number) => void;
};

export const Presenter = ({
  data,
  prefectures,
  selectedPrefectureId,
  page,
  onPrefectureChange,
  onPageChange,
}: Props) => {
  const { schools, meta } = data;

  const handlePrefectureChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    onPrefectureChange(value === "" ? null : Number(value));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 3 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: colors.text.primary }}
        >
          高校一覧
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text.muted }}>
          {meta.total_count} 件
        </Typography>
      </Box>

      {/* 都道府県フィルター */}
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>都道府県</InputLabel>
          <Select
            label="都道府県"
            value={selectedPrefectureId === null ? "" : String(selectedPrefectureId)}
            onChange={handlePrefectureChange}
          >
            <MenuItem value="">すべて</MenuItem>
            {prefectures.map((pref) => (
              <MenuItem key={pref.id} value={String(pref.id)}>
                {pref.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* テーブル */}
      <Card
        elevation={0}
        sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2, mb: 3 }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {schools.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ py: 4, textAlign: "center" }}
            >
              高校が見つかりません
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.surface.light }}>
                    <TableCell sx={{ fontWeight: 600 }}>高校名</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>都道府県</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>生徒数</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>教師数</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>詳細</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow
                      key={school.id}
                      hover
                      sx={{ "&:last-child td": { border: 0 } }}
                    >
                      <TableCell>{school.name}</TableCell>
                      <TableCell>{school.prefecture_name}</TableCell>
                      <TableCell>{school.student_count}</TableCell>
                      <TableCell>{school.teacher_count}</TableCell>
                      <TableCell>
                        <Button
                          component={Link}
                          href={`/admin/schools/${school.id}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.75rem" }}
                        >
                          詳細
                        </Button>
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
