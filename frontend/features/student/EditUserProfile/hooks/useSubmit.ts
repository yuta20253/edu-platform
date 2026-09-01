"use client";

import { apiClient } from "@/libs/http/apiClient";
import { MeUser } from "@/types/common/me";
import { useRouter } from "next/navigation";
import { SubmitHandler } from "react-hook-form";
import { Address, ProfileForm } from "../types";
import { useState } from "react";

type ToastType = "success" | "error";

export const useSubmit = (townOptions: Address[], user: MeUser) => {
  const router = useRouter();

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success" as ToastType,
  });

  const closeToast = () =>
    setToast((prev) => ({
      ...prev,
      open: false,
    }));

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
        phone_number: data.phone_number,
        address_id: addressId,
      };

      await apiClient.patch("/api/student/profile", formattedData);

      setToast({
        open: true,
        message: "プロフィールを更新しました",
        severity: "success",
      });

      setTimeout(() => {
        router.push("/profile");
      }, 1000);
    } catch (error) {
      console.error(error);

      setToast({
        open: true,
        message: "更新に失敗しました",
        severity: "error",
      });
    }
  };

  return { onSubmit, toast, closeToast };
};
