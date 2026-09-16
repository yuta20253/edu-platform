"use client";

import { colors } from "@/app/theme/colors";
import { Card, CardContent } from "@mui/material";

export type TableCardDensity = "default" | "compact";

type Props = {
  density?: TableCardDensity;
  // 下余白。ページ末尾に置く場合など、詰めたいときに 0 を渡す。
  mb?: number;
  children: React.ReactNode;
};

// compact は行数の多い一覧向けの高密度バリアント。
// 角丸を落とし、セルの区切り線とゼブラ縞を子孫セレクタで当てる。
// ホバーはゼブラ縞より詳細度を高くして必ず勝たせる。
const compactSx = {
  borderRadius: 0,
  "& .MuiTableCell-root": {
    borderBottom: `1px solid ${colors.border.light}`,
  },
  "& .MuiTableHead-root .MuiTableCell-root": {
    borderBottom: `2px solid ${colors.border.light}`,
  },
  "& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)": {
    backgroundColor: colors.surface.default,
  },
  "& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root": {
    borderBottom: 0,
  },
  "& .MuiTableBody-root .MuiTableRow-root.MuiTableRow-hover:hover": {
    backgroundColor: colors.surface.light,
  },
};

// 管理画面のテーブルを包む共通のカード外枠。
// Card + CardContent の組み合わせが各画面で重複していたため切り出した。
export const TableCard = ({ density = "default", mb = 3, children }: Props) => (
  <Card
    elevation={0}
    data-testid="table-card"
    data-density={density}
    sx={{
      border: `1px solid ${colors.border.light}`,
      borderRadius: 2,
      mb,
      ...(density === "compact" ? compactSx : {}),
    }}
  >
    <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
      {children}
    </CardContent>
  </Card>
);
