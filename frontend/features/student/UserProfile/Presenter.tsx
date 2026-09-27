import { Box, Button, Typography } from "@mui/material";
import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { MeUser } from "@/types/common/me";
import { formatAddress, GenderLabel } from "./constants";
import { GenderType } from "@/types/common/gender";
import { ProfileMenu } from "./components/ProfileMenu";

const cardSx = {
  bgcolor: colors.surface.white,
  borderRadius: `${radius.md}px`,
  boxShadow: `0 1px 3px ${colors.shadow.footer}`,
} as const;

type Props = {
  user: MeUser;
};

export const Presenter = ({ user }: Props) => {
  const addressLabel = user.address ? formatAddress(user.address) : undefined;
  const subtitle = [user.high_school?.name, user.grade?.display_name]
    .filter(Boolean)
    .join(" ");

  const rows: { label: string; value: string }[] = [
    { label: "氏名カナ", value: user.name_kana },
    {
      label: "生年月日",
      value: user.user_personal_info?.birthday ?? "未設定",
    },
    {
      label: "性別",
      value: user.user_personal_info?.gender
        ? GenderLabel[user.user_personal_info.gender as GenderType]
        : "未設定",
    },
    {
      label: "電話番号",
      value: user.user_personal_info?.phone_number ?? "未設定",
    },
    { label: "住所", value: user.address ? addressLabel! : "未設定" },
    { label: "在籍高校", value: user.high_school?.name ?? "未設定" },
    { label: "学年", value: user.grade?.display_name ?? "未設定" },
  ];

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ fontWeight: 800, mt: 1, mb: 3 }}
      >
        プロフィール
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            flex: "none",
            borderRadius: "50%",
            bgcolor: colors.accent[600],
            color: colors.text.inverse,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 24,
          }}
        >
          {user.name.charAt(0)}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
            {user.name}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ ...cardSx, overflow: "hidden" }}>
        {rows.map((row, index) => (
          <Box
            key={row.label}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              px: 2,
              py: 1.75,
              borderBottom:
                index === rows.length - 1
                  ? "none"
                  : `1px solid ${colors.border.light}`,
            }}
          >
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              {row.label}
            </Typography>
            <Typography
              sx={{ fontSize: 14, fontWeight: 600, textAlign: "right" }}
            >
              {row.value}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
          mt: 3,
        }}
      >
        <Button variant="outlined" href="/">
          戻る
        </Button>
        <Button variant="contained" href="/profile/edit">
          編集する
        </Button>
      </Box>

      <ProfileMenu />
    </Box>
  );
};
