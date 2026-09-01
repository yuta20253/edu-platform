"use client";

import { Presenter } from "./Presenter";
import { useSubmit } from "./hooks/useSubmit";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { useFetchAddresses } from "./hooks/useFetchAddresses";
import { MeUser } from "@/types/common/me";
import { Prefecture } from "@/types/common/prefecture";
import { useMemo, useEffect, useState } from "react";
import { ProfileForm } from "./types";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

type Props = {
  user: MeUser;
  prefectures: Prefecture[];
};

export const Container = ({ user, prefectures }: Props) => {
  const router = useRouter();
  const defaultValues = useDefaultValues(user);

  const {
    control,
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues,
  });

  const prefectureId = watch("prefecture_id");
  const city = watch("city");
  const town = watch("town");

  const {
    cityOptions,
    townOptions,
    fetchCities,
    fetchTowns,
    setCityOptions,
    setTownOptions,
  } = useFetchAddresses();

  const initialCityOptions = useMemo(() => {
    return user.address ? [user.address.city] : [];
  }, [user.address]);

  const initialTownOptions = useMemo(() => {
    return user.address
      ? [
          {
            id: user.address.id,
            city: user.address.city,
            town: user.address.town,
          },
        ]
      : [];
  }, [user.address]);

  const { onSubmit, toast, closeToast } = useSubmit(townOptions, user);

  const [openConfirm, setOpenConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (!prefectureId) {
      setCityOptions([]);
      setTownOptions([]);
      return;
    }

    fetchCities(prefectureId);
  }, [prefectureId, fetchCities, setCityOptions, setTownOptions]);

  useEffect(() => {
    if (!prefectureId || !city) {
      setTownOptions([]);
      return;
    }

    fetchTowns(prefectureId, city);
  }, [prefectureId, city, fetchTowns, setTownOptions]);

  const mergedCityOptions =
    cityOptions.length > 0 ? cityOptions : initialCityOptions;

  const mergedTownOptions =
    townOptions.length > 0 ? townOptions : initialTownOptions;

  /**
   * 初期表示でも変更後でも
   * town に対応する address_id を同期
   */
  useEffect(() => {
    if (!town) {
      setValue("address_id", null);
      return;
    }

    const selected = mergedTownOptions.find((item) => item.town === town);

    if (selected) {
      setValue("address_id", selected.id);
    } else {
      setValue("address_id", null);
    }
  }, [town, mergedTownOptions, setValue]);
  return (
    <Presenter
      user={user}
      prefectures={prefectures}
      control={control}
      register={register}
      errors={errors}
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      setValue={setValue}
      prefectureId={prefectureId}
      city={city}
      cityOptions={mergedCityOptions}
      townOptions={mergedTownOptions}
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
