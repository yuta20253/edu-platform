"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UnsentTeacher } from "../types";

type Props = {
  teachers: UnsentTeacher[];
  refetch: () => Promise<void>;
};

export const useSendInvites = ({ teachers, refetch }: Props) => {
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleToggleTeacher = (teacherId: number) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId],
    );
  };

  const selectableTeacherIds = teachers.map((teacher) => teacher.id);
  const allSelected =
    selectableTeacherIds.length > 0 &&
    selectableTeacherIds.every((id) => selectedTeacherIds.includes(id));

  const handleSendInvites = async () => {
    if (selectedTeacherIds.length === 0) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const response = await apiClient.post(
        "/api/teacher/teacher_notifications",
        {
          teacher_ids: selectedTeacherIds,
        },
      );

      if (response.status === 202) {
        setSuccessMessage("招待の送信を開始しました。");
      }

      setSelectedTeacherIds([]);
      await refetch();
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        router.push("/login");
        return;
      }
      setSubmitError("招待送信に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedTeacherIds([]);
    } else {
      setSelectedTeacherIds(selectableTeacherIds);
    }
  };

  return {
    selectedTeacherIds,
    submitting,
    submitError,
    successMessage,
    allSelected,
    handleToggleTeacher,
    handleToggleAll,
    handleSendInvites,
  };
};
