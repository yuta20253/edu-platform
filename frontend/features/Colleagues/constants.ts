import { ChipProps } from "@mui/material";
import { InvitationStatus } from "./types";

export const invitationStatusConfig: Record<
  InvitationStatus,
  {
    label: string;
    color: ChipProps["color"];
  }
> = {
  pending: {
    label: "未送信",
    color: "default",
  },
  sent: {
    label: "送信済",
    color: "success",
  },
  failed: {
    label: "送信失敗",
    color: "error",
  },
};
