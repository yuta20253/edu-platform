"use client";

import { colors } from "@/app/theme/colors";
import { Chip, type ChipProps } from "@mui/material";

// MUIのChip color propで使えるキーワードに加え、生の色コード(#... / rgb...)も
// 受け付ける。既存画面には両方の表現が混在しているため。
export type StatusBadgeColor =
  | NonNullable<ChipProps["color"]>
  | (string & Record<never, never>);

export type StatusBadgeDefinition = {
  label: string;
  color: StatusBadgeColor;
};

type Props = {
  status: string;
  definitions: Record<string, StatusBadgeDefinition>;
  // バックエンドが未知のstatus値を返した場合に使う表示。
  // 一覧全体をクラッシュさせないための必須のフォールバック。
  fallback?: StatusBadgeDefinition;
  size?: ChipProps["size"];
};

const DEFAULT_FALLBACK: StatusBadgeDefinition = {
  label: "不明",
  color: "default",
};

const isRawColor = (color: string) => /^#|^rgb/.test(color);

// ステータス→ラベル/色のマッピングが13箇所以上バラバラに実装されていたため
// 共通化する。MUIのcolor enum・生の色コードの両方の表現を吸収し、
// 定義されていないstatus値でもクラッシュせずfallbackで表示する。
export const StatusBadge = ({
  status,
  definitions,
  fallback = DEFAULT_FALLBACK,
  size = "small",
}: Props) => {
  const definition = definitions[status] ?? fallback;

  if (isRawColor(definition.color)) {
    return (
      <Chip
        label={definition.label}
        size={size}
        sx={{
          bgcolor: definition.color,
          color: colors.text.inverse,
          fontWeight: 600,
          fontSize: "0.7rem",
        }}
      />
    );
  }

  return (
    <Chip
      label={definition.label}
      size={size}
      color={definition.color as ChipProps["color"]}
    />
  );
};
