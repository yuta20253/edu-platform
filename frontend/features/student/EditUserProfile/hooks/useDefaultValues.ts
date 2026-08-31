import { MeUser } from "@/types/common/me";

export const useDefaultValues = (user: MeUser) => {
  return {
    name: user.name,
    name_kana: user.name_kana,
    phone_number: user.user_personal_info?.phone_number ?? "",
    birthday: user.user_personal_info?.birthday ?? "",
    gender: user.user_personal_info?.gender ?? "",
    postal_code: user.address?.postal_code ?? "",
    city: user.address?.city ?? "",
    town: user.address?.town ?? "",
    street_address: user.address?.street_address ?? "",
    prefecture_id: user.address?.prefecture?.id ?? undefined,
    address_id: user.address?.id ?? null,
  };
};
