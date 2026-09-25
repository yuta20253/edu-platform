"use client";

import { colors } from "@/app/theme/colors";
import {
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import Link from "next/link";
import { formatPublishedAt } from "@/libs/ui/formatDate";
import { Announcement } from "@/types/announcement/announcement";

type Props = {
  announcements: Announcement[];
};

export const ReceivedList = ({ announcements }: Props) => (
  <Card
    elevation={0}
    sx={{
      width: "100%",
      border: `1px solid ${colors.border.light}`,
      borderRadius: 2,
      overflow: "hidden",
      mb: 3,
    }}
  >
    <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
      <TableContainer sx={{ width: "100%" }}>
        <Table
          size="small"
          sx={{
            minWidth: 700,
            "& th, & td": { py: 1.5, px: 2, verticalAlign: "middle" },
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                bgcolor: colors.surface.light,
                "& th": {
                  fontWeight: 700,
                  color: colors.text.primary,
                  borderBottom: `1px solid ${colors.border.light}`,
                },
              }}
            >
              <TableCell>タイトル</TableCell>
              <TableCell>発行者</TableCell>
              <TableCell>公開日時</TableCell>
              <TableCell align="center">詳細</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  お知らせが見つかりません
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((announcement) => (
                <TableRow
                  key={announcement.id}
                  hover
                  sx={{
                    transition: "background-color 0.15s ease",
                    "&:last-child td": { borderBottom: 0 },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>
                    {announcement.title}
                  </TableCell>

                  <TableCell>{announcement.publisher.name}</TableCell>

                  <TableCell>
                    {formatPublishedAt(announcement.published_at)}
                  </TableCell>

                  <TableCell align="center">
                    <Button
                      component={Link}
                      href={`/teacher/announcements/${announcement.id}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        minWidth: 64,
                        height: 28,
                        px: 1.5,
                        fontSize: "0.75rem",
                        borderRadius: 1.5,
                        textTransform: "none",
                      }}
                    >
                      詳細
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
);
