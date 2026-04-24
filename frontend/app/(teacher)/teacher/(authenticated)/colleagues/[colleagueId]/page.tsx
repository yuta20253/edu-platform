import { ColleagueDetail } from "@/features/ColleagueDetail";

type Props = {
    params: Promise<{colleagueId: string}>;
};

export default async function ColleaguePage({ params }: Props) {
    const { colleagueId } = await params;
    return <ColleagueDetail colleagueId={Number(colleagueId)} />;
}
