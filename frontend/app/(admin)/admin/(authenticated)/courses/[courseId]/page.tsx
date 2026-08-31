import { CourseDetail } from "@/features/admin/CourseDetail";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function AdminCourseDetailPage({ params }: Props) {
  const { courseId } = await params;

  return <CourseDetail courseId={Number(courseId)} />;
}
