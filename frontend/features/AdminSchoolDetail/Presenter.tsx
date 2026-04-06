"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import { colors } from "@/app/theme/colors";
import type { AdminSchoolDetail } from "./types";

type Props = {
  school: AdminSchoolDetail;
};

type TabValue = "overview" | "teachers";

export const Presenter = ({ school }: Props) => {
  const [activeTab, setActiveTab] = useState<TabValue>("overview");

  return (
    <Box sx={{ p: 3 }}>
      {/* パンくずナビ */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          href="/admin/schools"
          style={{ color: colors.brand.primary, textDecoration: "none" }}
        >
          高校一覧
        </Link>
        <Typography color="text.primary">{school.name}</Typography>
      </Breadcrumbs>

      {/* ページタイトル */}
      <Typography
        variant="h5"
        component="h1"
        fontWeight={700}
        sx={{ color: colors.text.primary, mb: 3 }}
      >
        {school.name}
      </Typography>

      {/* タブ */}
      <Box sx={{ borderBottom: 1, borderColor: colors.border.light, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val: TabValue) => setActiveTab(val)}
        >
          <Tab label="概要" value="overview" />
          <Tab label="教師管理" value="teachers" />
        </Tabs>
      </Box>

      {/* 概要タブ */}
      {activeTab === "overview" && (
        <Card
          elevation={0}
          sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
        >
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography
                  variant="body2"
                  sx={{ color: colors.text.muted, mb: 0.5 }}
                >
                  生徒数
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {school.student_count}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography
                  variant="body2"
                  sx={{ color: colors.text.muted, mb: 0.5 }}
                >
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
      )}

      {/* 教師管理タブ */}
      {activeTab === "teachers" && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 10,
            gap: 2,
          }}
        >
          <SchoolIcon sx={{ fontSize: 64, color: colors.text.muted }} />
          <Typography variant="h6" sx={{ color: colors.text.secondary }}>
            まだ教師が登録されていません
          </Typography>
          <Button variant="contained" disabled>
            最初の教師を追加する
          </Button>
        </Box>
      )}
    </Box>
  );
};
