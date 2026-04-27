import { Address } from "@/types/common/address";
import { GenderType } from "@/types/common/gender";

export const GenderLabel: Record<GenderType, string> = {
  male: "男",
  female: "女",
  other: "その他",
};

export const formatAddress = (address: Address) => {
  const label = address.prefecture.name + address.city + address.town;
  return label;
};
