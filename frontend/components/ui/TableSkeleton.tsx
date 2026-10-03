"use client";

import { Skeleton, TableBody, TableCell, TableRow } from "@mui/material";

type Props = {
  rows?: number;
  columns?: number;
};

// テーブル一覧のローディング表示。手書きの中央寄せCircularProgressに
// 代わり、実レイアウトと同じ行・列のグリッドにスケルトンを載せる。
// <Table>の中に直接置いて使う（TableHeadは呼び出し側でそのまま描画する）。
export const TableSkeleton = ({ rows = 5, columns = 4 }: Props) => (
  <TableBody>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <TableRow key={rowIndex}>
        {Array.from({ length: columns }).map((_, columnIndex) => (
          <TableCell key={columnIndex}>
            <Skeleton variant="text" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
);
