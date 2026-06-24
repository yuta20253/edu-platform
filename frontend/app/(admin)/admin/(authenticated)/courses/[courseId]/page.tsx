import { AdminCourseDetail } from "@/features/AdminCourseDetail";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function AdminCourseDetailPage({ params }: Props) {
  const { courseId } = await params;

  return <AdminCourseDetail courseId={Number(courseId)} />;
}
