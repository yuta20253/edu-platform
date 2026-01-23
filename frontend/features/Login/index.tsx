'use client';

import { Alert, Box, Button, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm, SubmitHandler } from 'react-hook-form';
import Link from 'next/link';
import { useAuthActions } from '@/context/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type LoginFormType = {
    email: string;
    password: string;
};

export const Login = (): React.JSX.Element => {
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const router = useRouter();
    const { login } = useAuthActions();

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormType>();

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

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
            }}
        >
            <Box
                sx={{width: '100%',maxWidth: 600}}
            >
                <Typography variant='h4' component='p' sx={{ fontWeight: 'bold', mt: 4, textAlign: 'center' }}>
                    ログイン
                </Typography>
                {
                    errorMessage && (
                        <Alert severity='error' sx={{ mt: 2 }}>
                            {errorMessage}
                        </Alert>
                    )
                }
                <Box sx={{ padding: 2, width: '100%' }}>
                    <Box component='form' sx={{ width: '100%', maxWidth: 600, mx: 'auto', mt: 5 }} onSubmit={handleSubmit(onSubmit)}>
                        <Box sx={{ mb: 2 }}>
                            <Typography>メールアドレス</Typography>
                            <TextField fullWidth variant='outlined' {...register('email', {
                                required: 'メールアドレスを入力してください',
                                pattern: {
                                    value: /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/,
                                    message: 'メールアドレスの形式が正しくありません',
                                }
                            })}
                            error={!!errors.email}
                            helperText={errors.email?.message}
                            />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography>パスワード</Typography>
                            <TextField type={showPassword ? 'text' : 'password'} fullWidth variant='outlined'
                                {...register('password', {
                                    required: 'パスワードを入力してください',
                                    minLength: { value: 8, message: '8文字以上で入力してください' }
                                }
                            )}
                            slotProps={{
                                input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                    </InputAdornment>
                                ),
                                },
                            }}
                            error={!!errors.password}
                            helperText={errors.password?.message}
                            />
                        </Box>
                        <Box sx={{ my: 4 }}>
                            <Button
                                type="submit"
                                sx={{
                                    width: '100%',
                                    backgroundColor: '#0068b7',
                                    color: '#ffffff',
                                    p: 2,
                                    fontSize: 'large',
                                }}
                            >
                                <Typography sx={{ fontSize: 'large', textAlign: 'center' }}>ログイン</Typography>
                            </Button>
                        </Box>
                        <Box sx={{ width: '100%', textAlign: 'center' }}>
                            <Link href="/password-reset">パスワードをお忘れの方はこちら</Link>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
