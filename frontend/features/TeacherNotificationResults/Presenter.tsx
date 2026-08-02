"use client";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { TeacherNotificationResultsData } from "./types";

type Props = {
  data: TeacherNotificationResultsData;
};

export const Presenter = ({ data }: Props) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ mb: 3, color: "#0f172a" }}
      >
        送信結果
      </Typography>
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <CardContent>
          {data.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ py: 6, textAlign: "center" }}
            >
              送信された通知はありません
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>送信日時</TableCell>
                  <TableCell>送信者</TableCell>
                  <TableCell>受信者</TableCell>
                  <TableCell>メール</TableCell>
                  <TableCell>ステータス</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {item.formatted_sent_at ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography>{item.sender_user.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography>{item.receiver_user.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.email}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status === "sent" ? "成功" : "失敗"}
                        size="small"
                        sx={{
                          bgcolor: item.status === "sent" ? "#22c55e" : "#64748b",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
