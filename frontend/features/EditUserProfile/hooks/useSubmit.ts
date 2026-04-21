"use client";

import { apiClient } from "@/libs/http/apiClient";
import { MeUser } from "@/types/common/me";
import { useRouter } from "next/navigation";
import { SubmitHandler } from "react-hook-form";
import { Address } from "../types";


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
  prefecture_id: number | null;
  address_id: number | null;
};

export const useSubmit = (townOptions: Address[], user: MeUser) => {
  const router = useRouter();

  const onSubmit: SubmitHandler<ProfileForm> = async (data) => {
    try {
      let addressId: number | null = null;

      // town変更後
      const selectedTown = townOptions.find((item) => item.town === data.town);

      if (selectedTown) {
        addressId = selectedTown.id;
      }
      // 初期表示のまま変更なし
      else if (user.address && user.address.town === data.town) {
        addressId = user.address.id;
      }

      const formattedData = {
        name: data.name,
        name_kana: data.name_kana,
        gender: data.gender,
        birthday: data.birthday,
        phone_number: data.phone1 + data.phone2 + data.phone3,
        address_id: addressId,
      };

      await apiClient.patch("/api/student/profile", formattedData);
      router.push("/");
    } catch (error) {
      console.error(error);
    }
  };

  return { onSubmit };
};
