"use client";

import { useState, type SyntheticEvent } from "react";
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
  // 一度表示したタブはアンマウントせず非表示にすることで、タブを行き来する
  // たびに各タブのデータが再フェッチされるのを防ぐ
  const [mountedTabs, setMountedTabs] = useState<ReadonlySet<TabValue>>(
    () => new Set(["overview"]),
  );

  const handleTabChange = (_: SyntheticEvent, value: TabValue) => {
    setActiveTab(value);
    setMountedTabs((prev) =>
      prev.has(value) ? prev : new Set(prev).add(value),
    );
  };

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
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="概要" value="overview" />
          <Tab label="教師管理" value="teachers" />
          <Tab label="学年・クラス" value="grades" />
          <Tab label="お知らせ" value="announcements" />
        </Tabs>
      </Box>

      {mountedTabs.has("overview") && (
        <Box hidden={activeTab !== "overview"}>
          <OverviewTab school={school} />
        </Box>
      )}
      {mountedTabs.has("teachers") && (
        <Box hidden={activeTab !== "teachers"}>
          <TeachersTab schoolId={school.id} />
        </Box>
      )}
      {mountedTabs.has("grades") && (
        <Box hidden={activeTab !== "grades"}>
          <GradesTab schoolId={school.id} />
        </Box>
      )}
      {mountedTabs.has("announcements") && (
        <Box hidden={activeTab !== "announcements"}>
          <AnnouncementsTab schoolId={school.id} />
        </Box>
      )}
    </Box>
  );
};
