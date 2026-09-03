import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useForm } from "react-hook-form";
import { Presenter } from "./Presenter";
import { ProfileForm } from "./types";
import { MeUser } from "@/types/common/me";
import { Prefecture } from "@/types/common/prefecture";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const mockUser: MeUser = {
  id: 1,
  name: "山田太郎",
  name_kana: "ヤマダタロウ",
  email: "yamada@example.com",
  profile_completed: true,
  user_personal_info: {
    id: 10,
    phone_number: "09012345678",
    birthday: "2005-04-01",
    gender: "male",
  },
  user_role: { name: "student" },
  high_school: { name: "東京第一高校" },
  grade: { year: 2, display_name: "高校2年" },
  address: {
    id: 5,
    postal_code: "1000001",
    city: "千代田区",
    town: "千代田",
    street_address: "1-1",
    prefecture: { id: 13, name: "東京都" },
  },
};

const defaultValues: ProfileForm = {
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

const prefectures: Prefecture[] = [{ id: 13, name: "東京都" }];

type WrapperProps = {
  user?: MeUser;
  onSubmit?: (data: ProfileForm) => void;
  errors?: Record<string, { message?: string }>;
  cityOptions?: string[];
  townOptions?: { id: number; city: string; town: string }[];
  setCityOptions?: (v: string[]) => void;
  setTownOptions?: (v: { id: number; city: string; town: string }[]) => void;
  toast?: { open: boolean; message: string; severity: "success" | "error" };
  closeToast?: () => void;
  openConfirm?: boolean;
  setOpenConfirm?: (v: boolean) => void;
  router?: AppRouterInstance;
  formValues?: Partial<ProfileForm>;
};

const Wrapper = ({
  user = mockUser,
  onSubmit = vi.fn(),
  errors = {},
  cityOptions = ["千代田区"],
  townOptions = [{ id: 5, city: "千代田区", town: "千代田" }],
  setCityOptions = vi.fn(),
  setTownOptions = vi.fn(),
  toast = { open: false, message: "", severity: "success" as const },
  closeToast = vi.fn(),
  openConfirm = false,
  setOpenConfirm = vi.fn(),
  router = { push: vi.fn() } as unknown as AppRouterInstance,
  formValues = {},
}: WrapperProps) => {
  const { control, register, watch, setValue, handleSubmit } =
    useForm<ProfileForm>({
      defaultValues: { ...defaultValues, ...formValues },
    });

  const prefectureId = watch("prefecture_id");
  const city = watch("city");

  return (
    <Presenter
      user={user}
      prefectures={prefectures}
      control={control}
      register={register}
      errors={errors as never}
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      setValue={setValue}
      prefectureId={prefectureId}
      city={city}
      cityOptions={cityOptions}
      townOptions={townOptions}
      setCityOptions={setCityOptions}
      setTownOptions={setTownOptions}
      toast={toast}
      closeToast={closeToast}
      openConfirm={openConfirm}
      setOpenConfirm={setOpenConfirm}
      router={router}
    />
  );
};

describe("EditUserProfilePresenter", () => {
  it("氏名・氏名カナ・電話番号・郵便番号・番地の初期値が入力欄に表示される", () => {
    render(<Wrapper />);
    expect(screen.getByDisplayValue("山田太郎")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ヤマダタロウ")).toBeInTheDocument();
    expect(screen.getByDisplayValue("09012345678")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1000001")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1-1")).toBeInTheDocument();
  });

  it("在籍高校・学年が読み取り専用で表示される", () => {
    render(<Wrapper />);
    expect(screen.getByText("東京第一高校")).toBeInTheDocument();
    expect(screen.getByText("高校2年")).toBeInTheDocument();
  });

  it("在籍高校・学年が未設定なら「未設定」と表示される", () => {
    render(
      <Wrapper
        user={{ ...mockUser, high_school: undefined, grade: undefined }}
      />,
    );
    expect(screen.getAllByText("未設定").length).toBe(2);
  });

  it("氏名を編集して更新すると onSubmit が編集値で呼ばれる", async () => {
    const onSubmit = vi.fn();
    render(<Wrapper onSubmit={onSubmit} />);

    fireEvent.change(screen.getByDisplayValue("山田太郎"), {
      target: { value: "鈴木花子" },
    });
    fireEvent.click(screen.getByRole("button", { name: "更新" }));

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: "鈴木花子" }),
        expect.anything(),
      );
    });
  });

  it("エラーメッセージが helperText として表示される", () => {
    render(
      <Wrapper errors={{ name: { message: "氏名を入力してください" } }} />,
    );
    expect(screen.getByText("氏名を入力してください")).toBeInTheDocument();
  });

  it("都道府県未選択のとき市区町村の入力欄が disabled になる", () => {
    render(
      <Wrapper
        formValues={{ prefecture_id: null, city: "", town: "" }}
        cityOptions={[]}
        townOptions={[]}
      />,
    );
    expect(screen.getByPlaceholderText("市区町村")).toBeDisabled();
  });

  it("市区町村未入力のとき町名・丁目の入力欄が disabled になる", () => {
    render(<Wrapper formValues={{ city: "", town: "" }} townOptions={[]} />);
    expect(screen.getByPlaceholderText("町名・丁目")).toBeDisabled();
  });

  it("「戻る」ボタンで setOpenConfirm(true) が呼ばれる", () => {
    const setOpenConfirm = vi.fn();
    render(<Wrapper setOpenConfirm={setOpenConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(setOpenConfirm).toHaveBeenCalledWith(true);
  });

  it("確認ダイアログの「キャンセル」で setOpenConfirm(false) が呼ばれる", () => {
    const setOpenConfirm = vi.fn();
    render(<Wrapper openConfirm setOpenConfirm={setOpenConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(setOpenConfirm).toHaveBeenCalledWith(false);
  });

  it("確認ダイアログの「OK」で router.push が呼ばれる", () => {
    const push = vi.fn();
    render(
      <Wrapper openConfirm router={{ push } as unknown as AppRouterInstance} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(push).toHaveBeenCalledWith("/profile");
  });

  it("toast.open のときメッセージが表示される", () => {
    render(
      <Wrapper
        toast={{
          open: true,
          message: "プロフィールを更新しました",
          severity: "success",
        }}
      />,
    );
    expect(screen.getByText("プロフィールを更新しました")).toBeInTheDocument();
  });
});
