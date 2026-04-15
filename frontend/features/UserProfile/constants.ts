import { GenderType } from "./types";

type Address = {
  postal_code: string;
  city: string;
  town: string;
  prefecture: {
    id: number;
    name: string;
  };
};

export const GenderLabel: Record<GenderType, string> = {
  male: "男",
  female: "女",
  other: "その他",
};

export const AddressLabel = (address: Address) => {
  const label = address.prefecture.name + address.city + address.town;
  return label;
};
