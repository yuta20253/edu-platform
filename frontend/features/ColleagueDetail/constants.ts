import { Address } from "@/types/common/address";

export const formatAddress = (address: Address) => {
  const label = address.prefecture.name + address.city + address.town;
  return label;
};
