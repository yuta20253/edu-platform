// ESLint 8 の flat config を Node API で使うための型。
// eslint/use-at-your-own-risk には型定義が付いていない(@types/eslint も入れていない)ため、
// lint/displayRules.test.ts が使う範囲だけを宣言する。
declare module "eslint/use-at-your-own-risk" {
  export type LintMessage = {
    ruleId: string | null;
    severity: number;
    message: string;
    line: number;
  };

  export type LintResult = {
    filePath: string;
    messages: LintMessage[];
  };

  export class FlatESLint {
    constructor(options?: { overrideConfigFile?: string });
    lintText(
      code: string,
      options?: { filePath?: string },
    ): Promise<LintResult[]>;
  }
}
