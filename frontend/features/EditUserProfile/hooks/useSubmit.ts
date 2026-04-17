import { SubmitHandler } from "react-hook-form";

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

export const useSubmit = () => {
  const onSubmit: SubmitHandler<ProfileForm> = async (data) => {
    try {
      const formattedData = {
        name: data.name,
        name_kana: data.name_kana,
        gender: data.gender,
        birthday: data.birthday,
        phone_number: data.phone1 + data.phone2 + data.phone3,
        postal_code: data.postal_code,
        city: data.city,
        town: data.town,
        street_address: data.street_address,
        prefecture_id: data.prefecture_id,
      };

      console.log(formattedData);
    } catch (error) {
      console.error("ユーザー情報の更新に失敗しました。");
    }
  };

  return { onSubmit };
};
