"use client";

import { colors } from "@/app/theme/colors";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { STATUS_COLOR, STATUS_LABEL } from "../constants";
import { AuthoredAnnouncement } from "../types";
import { getDateLabel } from "./getDateLabel";

type Props = {
  announcements: AuthoredAnnouncement[];
};

export const AuthoredList = ({ announcements }: Props) => {
  if (announcements.length === 0) {
    return (
      <Card
        elevation={0}
        sx={{
          width: "100%",
          border: `1px solid ${colors.border.light}`,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <CardContent>
          <Typography sx={{ py: 2, textAlign: "center" }}>
            お知らせが見つかりません
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      {announcements.map((announcement) => (
        <Accordion
          key={announcement.id}
          elevation={0}
          sx={{
            border: `1px solid ${colors.border.light}`,
            borderRadius: 2,
            mb: 1,
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: 2,
                pr: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography sx={{ fontWeight: 600 }}>
                {announcement.title}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Chip
                  label={STATUS_LABEL[announcement.status]}
                  color={STATUS_COLOR[announcement.status]}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />

                <Typography
                  sx={{ fontSize: 12, color: colors.text.muted, minWidth: 140 }}
                >
                  {getDateLabel(announcement)}
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>

          <AccordionDetails>
            <Typography
              sx={{
                fontSize: 14,
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
                color: "text.primary",
                mb: 2,
              }}
            >
              {announcement.content || "内容はまだ入力されていません。"}
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                size="small"
                disabled
                sx={{
                  minWidth: 64,
                  height: 28,
                  px: 1.5,
                  fontSize: "0.75rem",
                  borderRadius: 1.5,
                  textTransform: "none",
                }}
              >
                更新
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};
