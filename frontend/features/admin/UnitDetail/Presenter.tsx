"use client";

import { colors } from "@/app/theme/colors";
import { buildCourseLabel } from "@/libs/domain/course/courseLabel";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { importStatusLabel } from "@/constants/import_status";
import type { ImportStatus } from "@/types/common/import_history";
import Link from "next/link";
import type { UnitDetail } from "./types";

// 取込日時は実行環境のTZに依存せず日本時間(JST)で表示する
const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type Props = {
  unit: UnitDetail;
  courseId: number;
};

const IMPORT_STATUS_COLOR: Record<
  ImportStatus,
  "default" | "info" | "success" | "error"
> = {
  pending: "default",
  processing: "info",
  completed: "success",
  failed: "error",
};

export const Presenter = ({ unit, courseId }: Props) => {
  const importHref = `/admin/courses/${courseId}/units/${unit.id}/import`;
  const hasQuestions = unit.questions.length > 0;
  const histories = unit.recent_import_histories;
  const courseLabel = buildCourseLabel(unit.course);

  return (
    <Box sx={{ p: 3 }}>
      {/* パンくずナビ */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          href="/admin/courses"
          style={{ color: colors.brand.primary, textDecoration: "none" }}
        >
          講座一覧
        </Link>
        <Link
          href={`/admin/courses/${courseId}`}
          style={{ color: colors.brand.primary, textDecoration: "none" }}
        >
          {courseLabel}
        </Link>
        <Typography color="text.primary">{unit.unit_name}</Typography>
      </Breadcrumbs>

      {/* ページタイトル + CSV追加ボタン */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 3,
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          fontWeight={700}
          sx={{ color: colors.text.primary }}
        >
          {unit.unit_name}
        </Typography>
        {/*
          CSVインポートウィザード(#P0-6)の想定遷移先。
          単元プリセット込みのURL。ウィザード本体は別issueで実装予定。
        */}
        <Button
          component={Link}
          href={importHref}
          variant="contained"
          startIcon={<UploadFileOutlinedIcon />}
        >
          CSVで問題を追加
        </Button>
      </Box>

      {/* 問題一覧（読み取り専用） */}
      {!hasQuestions ? (
        <Alert
          severity="info"
          icon={<UploadFileOutlinedIcon fontSize="inherit" />}
          action={
            <Button
              component={Link}
              href={importHref}
              color="inherit"
              size="small"
              startIcon={<UploadFileOutlinedIcon />}
            >
              CSVで問題を追加
            </Button>
          }
          sx={{ mb: 3, alignItems: "center" }}
        >
          この単元にはまだ問題がありません。CSVインポートで問題を追加してください。
        </Alert>
      ) : (
        <>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ color: colors.text.primary, mb: 1.5 }}
          >
            問題一覧（{unit.questions.length}問）
          </Typography>
          <Box sx={{ mb: 4 }}>
            {unit.questions.map((question, index) => (
              <Accordion
                key={question.id}
                disableGutters
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
                      gap: 1.5,
                      width: "100%",
                      minWidth: 0,
                    }}
                  >
                    <Chip
                      label={`Q${index + 1}`}
                      size="small"
                      sx={{ flexShrink: 0 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {question.question_text}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: colors.text.muted, mb: 0.5 }}
                      >
                        問題文
                      </Typography>
                      <Typography variant="body1">
                        {question.question_text}
                      </Typography>
                    </Box>

                    {question.choices.length > 0 && (
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: colors.text.muted, mb: 0.5 }}
                        >
                          選択肢
                        </Typography>
                        <Stack spacing={0.5}>
                          {question.choices.map((choice) => {
                            const isCorrect =
                              choice.choice_text === question.correct_answer;
                            return (
                              <Box
                                key={choice.id}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Typography variant="body2">
                                  {choice.choice_number != null
                                    ? `${choice.choice_number}. `
                                    : ""}
                                  {choice.choice_text}
                                </Typography>
                                {isCorrect && (
                                  <Chip
                                    label="正解"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>
                    )}

                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: colors.text.muted, mb: 0.5 }}
                      >
                        正解
                      </Typography>
                      <Typography variant="body1">
                        {question.correct_answer}
                      </Typography>
                    </Box>

                    {question.hints.length > 0 && (
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: colors.text.muted, mb: 0.5 }}
                        >
                          ヒント
                        </Typography>
                        <Stack spacing={0.5}>
                          {question.hints.map((hint) => (
                            <Typography key={hint.id} variant="body2">
                              {hint.step_number != null
                                ? `ステップ${hint.step_number}: `
                                : ""}
                              {hint.hint_text}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {question.explanations.length > 0 && (
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ color: colors.text.muted, mb: 0.5 }}
                        >
                          解説
                        </Typography>
                        <Stack spacing={1}>
                          {question.explanations.map((explanation) => (
                            <Box key={explanation.id}>
                              <Typography variant="body2" fontWeight={700}>
                                {explanation.explanation_type}
                              </Typography>
                              <Typography variant="body2">
                                {explanation.explanation_text}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </>
      )}

      {/* CSVインポート履歴（直近5件） */}
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{ color: colors.text.primary, mb: 1.5 }}
      >
        インポート履歴
      </Typography>
      <Card
        elevation={0}
        sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {histories.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography color="text.secondary">
                インポート履歴はありません
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.surface.light }}>
                    <TableCell sx={{ fontWeight: 600 }}>ファイル名</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ステータス</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      成功
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      エラー
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      合計
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>取込日時</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {histories.map((history) => (
                    /*
                      履歴詳細ページ(/admin/courses/[courseId]/units/[unitId]/import-histories/[id])は
                      未実装のため、現状はリンクなしの読み取り表示。別issueで詳細画面を実装予定。
                    */
                    <TableRow
                      key={history.id}
                      hover
                      sx={{ "&:last-child td": { border: 0 } }}
                    >
                      <TableCell>{history.file_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={importStatusLabel[history.status]}
                          size="small"
                          color={IMPORT_STATUS_COLOR[history.status]}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {history.success_count}
                      </TableCell>
                      <TableCell align="right">{history.error_count}</TableCell>
                      <TableCell align="right">{history.total_count}</TableCell>
                      <TableCell>
                        {dateFormatter.format(new Date(history.created_at))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
