// Rails のページネーション付き一覧 API が返す meta の共通型。
export type PaginationMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};
