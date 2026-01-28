'use client';

import { SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { LoginFormType } from '@/types/login/form';

type LoginProps = {
    login: (p: {
        email: string;
        password: string;
    }) => Promise<void>;
    setErrorMessage: (message: string) => void;
}

export const useSubmit = ({ login, setErrorMessage }: LoginProps) => {
    const router = useRouter();
    const onSubmit: SubmitHandler<LoginFormType> = async (data: LoginFormType) => {
        const email = data.email;
        const password = data.password;
        try {
            await login({ email, password });
            router.push('/');
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
