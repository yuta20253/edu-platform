"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { DryRunResult, DryRunRowSeverity } from "../types";

type Props = {
  loading: boolean;
  result: DryRunResult | null;
  error: string | null;
  onBack: () => void;
  onNext: () => void;
};

const SEVERITY_COLOR: Record<DryRunRowSeverity, "error" | "warning"> = {
  error: "error",
  warning: "warning",
};

export const Step2Preview = ({
  loading,
  result,
  error,
  onBack,
  onNext,
}: Props) => {
  const hasErrorRows = (result?.rows.length ?? 0) > 0;
  const canProceed = result != null && !error && !hasErrorRows;

  return (
    <Box>
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && result && (
        <Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            全{result.total_count}行中 {result.valid_count}行が有効
          </Typography>

          {hasErrorRows ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              エラーが{result.rows.length}
              件あります。修正後に再アップロードしてください。
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              エラーはありません
            </Alert>
          )}

          {hasErrorRows && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>行番号</TableCell>
                    <TableCell>種別</TableCell>
                    <TableCell>メッセージ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.rows.map((row) => (
                    <TableRow key={row.row_number}>
                      <TableCell>{row.row_number}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.severity}
                          size="small"
                          color={SEVERITY_COLOR[row.severity]}
                        />
                      </TableCell>
                      <TableCell>{row.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button onClick={onBack}>戻る</Button>
        <Button variant="contained" disabled={!canProceed} onClick={onNext}>
          次へ
        </Button>
      </Box>
    </Box>
  );
};
