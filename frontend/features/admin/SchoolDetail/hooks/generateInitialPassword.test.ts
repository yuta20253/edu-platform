import { describe, expect, it } from "vitest";
import { generateInitialPassword } from "./generateInitialPassword";

describe("generateInitialPassword", () => {
  it("12文字のパスワードを生成する", () => {
    expect(generateInitialPassword()).toHaveLength(12);
  });

  it("英大文字・小文字・数字のみで構成される", () => {
    expect(generateInitialPassword()).toMatch(/^[A-Za-z0-9]{12}$/);
  });

  it("呼び出すたびに異なる値を返す", () => {
    const passwords = new Set(
      Array.from({ length: 20 }, () => generateInitialPassword()),
    );
    expect(passwords.size).toBeGreaterThan(1);
  });
});
