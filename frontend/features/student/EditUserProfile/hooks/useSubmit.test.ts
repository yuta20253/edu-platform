import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useSubmit } from "./useSubmit";
import { MeUser } from "@/types/common/me";
import { ProfileForm } from "../types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { patch: vi.fn() },
}));

const mockUser: MeUser = {
  id: 1,
  name: "山田太郎",
  name_kana: "ヤマダタロウ",
  email: "yamada@example.com",
  profile_completed: true,
  user_role: { name: "student" },
  address: {
    id: 5,
    postal_code: "1000001",
    city: "千代田区",
    town: "千代田",
    street_address: "1-1",
    prefecture: { id: 13, name: "東京都" },
  },
};

const mockFormData: ProfileForm = {
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
};

describe("useSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("townOptionsに一致するtownがあればそのidをaddress_idとして送信する", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({});
    const { result } = renderHook(() =>
      useSubmit([{ id: 99, city: "千代田区", town: "千代田" }], mockUser),
    );

    await act(async () => {
      await result.current.onSubmit(mockFormData);
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      "/api/student/profile",
      expect.objectContaining({ address_id: 99 }),
    );
  });

  it("townOptionsに一致がなく初期のtownのままならuser.addressのidを使う", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({});
    const { result } = renderHook(() => useSubmit([], mockUser));

    await act(async () => {
      await result.current.onSubmit(mockFormData);
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      "/api/student/profile",
      expect.objectContaining({ address_id: 5 }),
    );
  });

  it("townOptionsにもuser.addressにも一致がなければaddress_idはnull", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({});
    const { result } = renderHook(() => useSubmit([], mockUser));

    await act(async () => {
      await result.current.onSubmit({ ...mockFormData, town: "別の町" });
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      "/api/student/profile",
      expect.objectContaining({ address_id: null }),
    );
  });

  it("成功時はtoastを表示し1秒後に/profileへ遷移する", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({});
    const { result } = renderHook(() => useSubmit([], mockUser));

    await act(async () => {
      await result.current.onSubmit(mockFormData);
    });

    expect(result.current.toast).toEqual({
      open: true,
      message: "プロフィールを更新しました",
      severity: "success",
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(pushMock).toHaveBeenCalledWith("/profile");
  });

  it("失敗時はエラーtoastを表示する", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue(new Error("failed"));
    const { result } = renderHook(() => useSubmit([], mockUser));

    await act(async () => {
      await result.current.onSubmit(mockFormData);
    });

    expect(result.current.toast).toEqual({
      open: true,
      message: "更新に失敗しました",
      severity: "error",
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("closeToastでtoast.openがfalseになる", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({});
    const { result } = renderHook(() => useSubmit([], mockUser));

    await act(async () => {
      await result.current.onSubmit(mockFormData);
    });

    act(() => {
      result.current.closeToast();
    });

    expect(result.current.toast.open).toBe(false);
  });
});
