import { Box, Card, CardContent, Typography } from "@mui/material";
import Link from "next/link";
import type { Goal } from "./types";

type Props = {
  data: Goal[];
  page: number;
  onPageChange: (page: number) => void;
};

export const Presenter = ({ data }: Props) => {
  const goals = data;

  return (
    <Box sx={{ p: 3 }}>
      <Box>
        <Typography
          variant="h4"
          component="p"
          sx={{ fontWeight: "bold", my: 4, textAlign: "center" }}
        >
          目標一覧
        </Typography>
        <Box display="flex" flexDirection="column" alignItems="center">
          {!goals || goals.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: "center" }}>
              目標が見つかりません
            </Typography>
          ) : (
            goals.map((goal) => (
              <Card
                key={goal.id}
                component={Link}
                href={`/goals/${goal.id}`}
                sx={{
                  width: "min(720px, 90vw)",
                  textDecoration: "none",
                  borderRadius: 3,
                  boxShadow: 2,
                  overflow: "hidden",
                  ":hover": { boxShadow: 4 },
                  m: 1,
                }}
              >
                <CardContent
                  sx={{ display: "flex", gap: 2, alignItems: "center", p: 2 }}
                ></CardContent>
              </Card>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
};
