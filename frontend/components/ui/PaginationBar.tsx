"use client";

import { Box, Pagination } from "@mui/material";

type Props = {
  totalPages: number;
  page: number;
  onChange: (page: number) => void;
};

// 一覧のページネーション。totalPages <= 1 のときは何も描画しない
// （呼び出し側で {totalPages > 1 && (...)} のガードを書く必要をなくす）。
export const PaginationBar = ({ totalPages, page, onChange }: Props) => {
  if (totalPages <= 1) return null;

  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Pagination
        count={totalPages}
        page={page}
        onChange={(_, value) => onChange(value)}
        color="primary"
      />
    </Box>
  );
};
