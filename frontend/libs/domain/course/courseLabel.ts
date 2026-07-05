// 講座の表示ラベル（例: 「標準レベル2」）を組み立てる。
// 講座詳細・単元詳細など複数画面で同じ表記を使うため共通化している。
export const buildCourseLabel = (course: {
  level_name: string;
  level_number: number;
}) => `${course.level_name}レベル${course.level_number}`;
