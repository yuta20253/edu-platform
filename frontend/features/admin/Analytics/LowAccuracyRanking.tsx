"use client";

import { colors } from "@/app/theme/colors";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  Typography,
} from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";
import { RateBar } from "./RateBar";
import type { LowAccuracyQuestion, LowAccuracyUnit } from "./types";

type Props = {
  units: LowAccuracyUnit[];
  questions: LowAccuracyQuestion[];
  // meta.min_answer_count。除外基準が見えないとデータを疑われるため注釈に出す。
  minAnswerCount: number;
};

const unitDetailPath = (courseId: number, unitId: number) =>
  `/admin/courses/${courseId}/units/${unitId}`;

type RankingCardProps = {
  title: string;
  note: string;
  isEmpty: boolean;
  children: ReactNode;
};

const RankingCard = ({ title, note, isEmpty, children }: RankingCardProps) => (
  <Card
    component="section"
    aria-label={title}
    elevation={0}
    sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
  >
    <CardContent sx={{ pb: 0 }}>
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {note}
      </Typography>
    </CardContent>
    {isEmpty ? (
      <EmptyState message="対象期間に十分な解答データがありません" />
    ) : (
      <List disablePadding>{children}</List>
    )}
  </Card>
);

const Stats = ({
  answerCount,
  accuracyRate,
}: {
  answerCount: number;
  accuracyRate: number;
}) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
    <Typography variant="body2" color="text.secondary">
      {answerCount.toLocaleString("ja-JP")}件
    </Typography>
    <RateBar value={accuracyRate} label="正答率" />
  </Box>
);

const rowSx = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 2,
  px: 2,
  py: 1.25,
  borderTop: `1px solid ${colors.border.light}`,
};

export const LowAccuracyRanking = ({
  units,
  questions,
  minAnswerCount,
}: Props) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
      gap: 2,
      mb: 3,
    }}
  >
    <RankingCard
      title="正答率が低い単元 ワースト10"
      note={`解答数${minAnswerCount}件以上の単元のみ集計`}
      isEmpty={units.length === 0}
    >
      {units.map((unit) => (
        <ListItem key={unit.unit_id} disablePadding>
          <ListItemButton
            component={Link}
            href={unitDetailPath(unit.course_id, unit.unit_id)}
            sx={rowSx}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {unit.unit_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {unit.course_name}
              </Typography>
            </Box>
            <Stats
              answerCount={unit.answer_count}
              accuracyRate={unit.accuracy_rate}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </RankingCard>

    <RankingCard
      title="正答率が低い設問 ワースト10"
      note={`解答数${minAnswerCount}件以上の設問のみ集計`}
      isEmpty={questions.length === 0}
    >
      {questions.map((question) => (
        <ListItem key={question.question_id} disablePadding>
          <ListItemButton
            component={Link}
            href={unitDetailPath(question.course_id, question.unit_id)}
            sx={rowSx}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {question.question_text}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {question.unit_name}
              </Typography>
            </Box>
            <Stats
              answerCount={question.answer_count}
              accuracyRate={question.accuracy_rate}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </RankingCard>
  </Box>
);
