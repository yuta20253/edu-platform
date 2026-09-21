import { SchoolClassDetail } from "@/features/teacher/SchoolClassDetail";

type Props = {
  params: Promise<{ schoolClassId: string }>;
};

export default async function SchoolClassPage({ params }: Props) {
  const { schoolClassId } = await params;
  return <SchoolClassDetail schoolClassId={Number(schoolClassId)} />;
}
