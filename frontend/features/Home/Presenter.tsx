"use client";

import { colors } from "@/app/theme/colors";
import { GoalType } from "@/libs/server/studentDashboard";
import { Box, Typography } from "@mui/material";
import Link from "next/link";
import { JSX, useMemo } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { FaPen } from "react-icons/fa";
import { statusLabel } from "./constants";
import { GoalStatus } from "./types";

export const Presenter = ({
  initialGoals,
}: {
  initialGoals: GoalType[];
}): JSX.Element => {
  const goals = useMemo(() => initialGoals ?? [], [initialGoals]);

  const goalTitles = ["目標", "達成度", "期限"];

  const links = [
    {
      href: "/exams",
      title: "定期テスト管理",
    },
    {
      href: "/desired-schools",
      title: "志望校管理",
    },
    {
      href: "/exam-schools",
      title: "受験校管理",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box sx={{ minHeight: "100vh", px: 2, pt: 20 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 90px 60px",
            px: 1,
            py: 0.75,
            fontSize: 16,
          }}
        >
          {goalTitles.map((title, i) => (
            <Box
              key={i}
              sx={{ borderLeft: `2px solid ${colors.border.divider}` }}
              textAlign="center"
            >
              {title}
            </Box>
          ))}
          <Box textAlign="right"></Box>
        </Box>

        {goals?.map((goal) => {
          const statusColor = colors.statusUi[goal.status as GoalStatus];

          return (
            <Box
              key={goal.id}
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 90px 60px",
                alignItems: "center",
                px: 1,
                py: 0.75,
                fontSize: 16,
              }}
            >
              <Box
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {goal.title}
              </Box>
              <Box sx={{ textAlign: "center", bgcolor: statusColor.bg }}>{statusLabel[goal.status as GoalStatus]}</Box>
              <Box sx={{ textAlign: "center" }}>{goal.due_date}</Box>
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Link href={`/goals/${goal.id}/edit`}>
                  <FaPen size={20} />
                </Link>
                <FaRegTrashAlt size={20} />
              </Box>
            </Box>
          );
        })}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
          <Link
            href={`/goals/new`}
            style={{
              backgroundColor: colors.brand.primary,
              color: colors.text.inverse,
              padding: "8px 12px",
              borderRadius: 10,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            目標追加
          </Link>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4 }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                backgroundColor: colors.brand.primary,
                color: colors.text.inverse,
                padding: "4px 8px",
                borderRadius: 10,
                fontSize: 16,
                textDecoration: "none",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="h6">{link.title}</Typography>
              </Box>
            </Link>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
