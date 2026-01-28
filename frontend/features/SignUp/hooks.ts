import { SubmitHandler } from "react-hook-form";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@/types/signUp/user";
import { UserRole } from "@/types/signUp/user_role";

type SignUpProps = {
    signUp: (p: { user: { email: string, name: string, name_kana: string, password: string, password_confirmation: string, user_role_name: UserRole, school_name: string}}) => Promise<void>;
    setErrorMessage: (message: string) => void;
}

export const useSubmit = ({signUp, setErrorMessage}: SignUpProps) => {
    const router = useRouter();
    const pathName = usePathname()

    const getRoleFromPath = (): UserRole => {
        if (pathName === '/signup') return 'student';
        const role = pathName.split('/')[1];
        return role as UserRole;
    }
    const onSubmit: SubmitHandler<User> = async (data: User) => {
        const role = getRoleFromPath();
        const postData: User = {
            user: {
                ...data.user,
                user_role_name: role,
            }
        };

        try {
            await signUp(postData);
            router.push('/login');
        } catch (error) {
            const message =
                error instanceof Error
                ? error.message
                : typeof error === 'string'
                    ? error
                    : '不明なエラーが発生しました';

            setErrorMessage(message);
        }
    };
    return {onSubmit};
};
