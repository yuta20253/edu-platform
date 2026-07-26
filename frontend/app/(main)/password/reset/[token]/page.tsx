import { PasswordReset } from "@/features/PasswordReset";

type Props = {
  params: Promise<{
    token: string;
  }>;
};

export default async function PasswordResetPage({ params }: Props) {
  const { token } = await params;
  return <PasswordReset token={token} />;
}
