export type NewPasswordForm = {
  password: string;
  password_confirmation: string;
};

export type VerifyState = {
  verifying: boolean;
  tokenValid: boolean;
};
