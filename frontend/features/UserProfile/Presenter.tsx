import { Box, Button, Divider, Typography } from "@mui/material";
import { GenderType } from "./types";
import { MeUser } from "@/types/common/me";
import { AddressLabel, GenderLabel } from "./constants";

type Props = {
  user: MeUser;
};

export const Presenter = ({ user }: Props) => {
  const addressLabel = user.address ? AddressLabel(user.address) : undefined;

  return (
    <Box sx={{ px: 2, py: 4, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Box sx={{ maxWidth: 800, width: "100%" }}>
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: 2,
            p: 4,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 4 }}>
            ユーザー情報
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                氏名
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
                {user.name}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                氏名カナ
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
                {user.name_kana}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                生年月日
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
                {user.user_personal_info?.birthday ?? "未設定"}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                性別
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
                {user.user_personal_info?.gender
                  ? GenderLabel[user.user_personal_info.gender as GenderType]
                  : "未設定"}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                電話番号
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
                {user.user_personal_info?.phone_number ?? "未設定"}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                住所
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
                {user.address ? addressLabel : "未設定"}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                在籍高校
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
                {user.high_school?.name ?? "未設定"}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                学年
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 500 }}>
                {user.grade?.display_name ?? "未設定"}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            mt: 3,
          }}
        >
          <Button variant="outlined" href="/">戻る</Button>
          <Button variant="contained" href="/profile/edit">
            編集する
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
