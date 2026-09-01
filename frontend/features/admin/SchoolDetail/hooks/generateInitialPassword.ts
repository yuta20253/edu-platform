const PASSWORD_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const PASSWORD_LENGTH = 12;

// 教師追加ドロワーの「自動生成」ボタン用。Deviseのvalidatable既定(6文字以上)を
// 十分満たす長さでランダムな初期パスワードを生成する。
export const generateInitialPassword = (): string => {
  const randomValues = new Uint32Array(PASSWORD_LENGTH);
  crypto.getRandomValues(randomValues);

  return Array.from(
    randomValues,
    (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length],
  ).join("");
};
