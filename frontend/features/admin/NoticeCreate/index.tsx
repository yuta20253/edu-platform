"use client";

import { Presenter } from "@/features/admin/NoticeEditor/Presenter";
import { useNoticeSubmit } from "@/features/admin/NoticeEditor/hooks/useNoticeSubmit";

// お知らせの新規作成画面。既存データの取得はなく、空のフォームを表示する。
export const NoticeCreate = () => {
  const submit = useNoticeSubmit({});

  return <Presenter notice={null} {...submit} />;
};
