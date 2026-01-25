import { SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { User } from "@/types/signUp/user";
import { UserRole } from "@/types/signUp/user_role";

type SignUpProps = {
    signUp: (p: { user: { email: string, name: string, name_kana: string, password: string, password_confirmation: string, user_role_name: string, school_name: string}}) => Promise<void>;
    setErrorMessage: (message: string) => void;
    userRole: UserRole;
}

export const useSubmit = ({signUp, setErrorMessage, userRole}: SignUpProps) => {
    const router = useRouter();
    const onSubmit: SubmitHandler<User> = async (data: User) => {
        const postData: User = {
            user: {
                ...data.user,
                user_role_name: userRole
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
