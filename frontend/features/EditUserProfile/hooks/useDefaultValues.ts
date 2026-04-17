import { MeUser } from "@/types/common/me";
import { useForm } from "react-hook-form";

type ProfileForm = {
  name: string;
  name_kana: string;
  phone1: string;
  phone2: string;
  phone3: string;
  birthday: string;
  gender: string;
  postal_code: string;
  city: string;
  town: string;
  street_address: string;
  prefecture_id: number;
};

export const useDefaultValues = (user: MeUser) => {
  const phone = user.user_personal_info?.phone_number ?? "";

  return useForm<ProfileForm>({
    defaultValues: {
      name: user.name,
      name_kana: user.name_kana,
      phone1: phone.slice(0, 3),
      phone2: phone.slice(3, 7),
      phone3: phone.slice(7),
      birthday: user.user_personal_info?.birthday ?? "",
      gender: user.user_personal_info?.gender ?? "",
      postal_code: user.address?.postal_code ?? "",
      city: user.address?.city ?? "",
      town: user.address?.town ?? "",
      street_address: user.address?.street_address ?? "",
      prefecture_id: user.address?.prefecture?.id ?? undefined,
    },
  });
};
