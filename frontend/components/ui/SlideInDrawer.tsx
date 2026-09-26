"use client";

import { Drawer } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  // 4箇所のドロワーすべてがnullable値から派生させたopenを渡すなど不揃いだった
  // ため、booleanを必須にする。
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

// 右からスライドインする共通ドロワー。anchor="right" / 幅480pxは
// 4箇所すべてでバイト単位で同一だったため切り出した。
export const SlideInDrawer = ({ open, onClose, children }: Props) => (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    slotProps={{ paper: { sx: { width: 480, maxWidth: "100%" } } }}
  >
    {children}
  </Drawer>
);
