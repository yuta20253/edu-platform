"use client";

import { Alert, Box, Button } from "@mui/material";
import { useFetchDashboard } from "./hooks/useFetchDashboard";
import { Presenter } from "./Presenter";
import { Skeleton } from "./Skeleton";

export function Dashboard() {
  const { data, loading, error, refetch } = useFetchDashboard();

  if (loading) {
    return <Skeleton />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              再読み込み
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  return <Presenter data={data} />;
}
