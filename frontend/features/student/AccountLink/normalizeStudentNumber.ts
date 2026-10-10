const FULLWIDTH_ALNUM_OFFSET = 0xfee0;

// IMEでの日本語入力時に、生徒コード(半角英数字+ハイフン)のつもりで
// 全角文字や長音符(ー)が入力されてしまうケースを吸収する。
export const normalizeStudentNumber = (value: string): string =>
  value
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - FULLWIDTH_ALNUM_OFFSET),
    )
    .replace(/[－ー‐−]/g, "-");
