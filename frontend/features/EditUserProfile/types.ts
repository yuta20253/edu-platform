export type Address = {
  id: number;
  city: string;
  town: string;
};

export type ProfileForm = {
  name: string;
  name_kana: string;
  phone_number: string;
  birthday: string;
  gender: string;
  postal_code: string;
  city: string;
  town: string;
  street_address: string;
  prefecture_id: number | null;
  address_id: number | null;
};
