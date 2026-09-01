import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDefaultValues } from "./useDefaultValues";
import { MeUser } from "@/types/common/me";

const baseUser: MeUser = {
  id: 1,
  name: "山田太郎",
  name_kana: "ヤマダタロウ",
  email: "yamada@example.com",
  profile_completed: true,
  user_role: { name: "student" },
};

describe("useDefaultValues", () => {
  it("user_personal_info・addressが揃っている場合はその値をセットする", () => {
    const user: MeUser = {
      ...baseUser,
      user_personal_info: {
        id: 10,
        phone_number: "09012345678",
        birthday: "2005-04-01",
        gender: "male",
      },
      address: {
        id: 5,
        postal_code: "1000001",
        city: "千代田区",
        town: "千代田",
        street_address: "1-1",
        prefecture: { id: 13, name: "東京都" },
      },
    };

    const { result } = renderHook(() => useDefaultValues(user));

    expect(result.current).toEqual({
      name: "山田太郎",
      name_kana: "ヤマダタロウ",
      phone_number: "09012345678",
      birthday: "2005-04-01",
      gender: "male",
      postal_code: "1000001",
      city: "千代田区",
      town: "千代田",
      street_address: "1-1",
      prefecture_id: 13,
      address_id: 5,
    });
  });

  it("user_personal_info・addressが未設定の場合は空文字/nullにフォールバックする", () => {
    const { result } = renderHook(() => useDefaultValues(baseUser));

    expect(result.current).toEqual({
      name: "山田太郎",
      name_kana: "ヤマダタロウ",
      phone_number: "",
      birthday: "",
      gender: "",
      postal_code: "",
      city: "",
      town: "",
      street_address: "",
      prefecture_id: undefined,
      address_id: null,
    });
  });
});
