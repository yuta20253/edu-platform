import { useEffect, useState } from "react";
import { apiClient } from "@/libs/http/apiClient";

export type NewPasswordForm = {
  password: string;
  password_confirmation: string;
};

type VerifyState = {
  verifying: boolean;
  tokenValid: boolean;
};

/** マウント時にメールのトークンを検証する。 */
export const useVerifyToken = (token: string): VerifyState => {
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) {
        if (active) {
          setTokenValid(false);
          setVerifying(false);
        }
        return;
      }
      try {
        await verifyResetToken(token);
        if (active) setTokenValid(true);
      } catch (e) {
        console.error("トークン検証に失敗", e);
        if (active) setTokenValid(false);
      } finally {
        if (active) setVerifying(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  return { verifying, tokenValid };
};

const verifyResetToken = async (token: string) => {
  console.log("verify start", token);
  const res = await apiClient.post("/api/auth/password-verify", {
    reset_password_token: token,
  });

  console.log(res);

  return res;
};
