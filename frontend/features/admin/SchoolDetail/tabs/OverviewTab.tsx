"use client";

import { Box, Card, CardContent, Divider, Grid, Typography } from "@mui/material";
import { colors } from "@/app/theme/colors";
import type { SchoolDetail } from "../types";

type Props = {
  school: SchoolDetail;
};

export const OverviewTab = ({ school }: Props) => (
  <Card elevation={0} sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}>
    <CardContent sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ color: colors.text.muted, mb: 0.5 }}>
            生徒数
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {school.student_count}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ color: colors.text.muted, mb: 0.5 }}>
            教師数
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {school.teacher_count}
          </Typography>
        </Grid>
      </Grid>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Typography variant="body2" sx={{ color: colors.text.muted }}>
          都道府県
        </Typography>
        <Typography variant="body1">{school.prefecture_name}</Typography>
      </Box>
    </CardContent>
  </Card>
);
