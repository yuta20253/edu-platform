"use client";

import { useState } from "react";
import Link from "next/link";
import { Box, Breadcrumbs, Tab, Tabs, Typography } from "@mui/material";
import { colors } from "@/app/theme/colors";
import { AnnouncementsTab } from "./tabs/AnnouncementsTab";
import { GradesTab } from "./tabs/GradesTab";
import { OverviewTab } from "./tabs/OverviewTab";
import { TeachersTab } from "./tabs/TeachersTab";
import type { SchoolDetail } from "./types";

type Props = {
  school: SchoolDetail;
};

type TabValue = "overview" | "teachers" | "grades" | "announcements";

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
          <Tab label="学年・クラス" value="grades" />
          <Tab label="お知らせ" value="announcements" />
        </Tabs>
      </Box>

      {activeTab === "overview" && <OverviewTab school={school} />}
      {activeTab === "teachers" && <TeachersTab schoolId={school.id} />}
      {activeTab === "grades" && <GradesTab schoolId={school.id} />}
      {activeTab === "announcements" && (
        <AnnouncementsTab schoolId={school.id} />
      )}
    </Box>
  );
};
