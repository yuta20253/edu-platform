'use client';

import { User } from '@/types/signUp/user';
import { Alert, Box, Button, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useAuthActions } from '@/context/AuthContext';
import { UserRole } from '@/types/signUp/user_role';
import { useSubmit } from './hooks';

export const SignUp = ({userRole}: { userRole: UserRole }): React.JSX.Element => {
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmationPassword, setShowConfirmationPassword] = useState<boolean>(false);
    const { signUp } = useAuthActions();
    const { register, handleSubmit, formState: { errors } } = useForm<User>();

    const { onSubmit } = useSubmit({signUp, setErrorMessage});

    const roleTitleMap = {
        student: '生徒',
        admin: '管理者',
        teacher: '教員',
        guardian: '保護者'
    } as const;

    type UserRole = keyof typeof roleTitleMap;

    const renderTabs = (userRole: UserRole) => {
        return Object
            .entries(roleTitleMap)
            .filter(([role]) => role !== userRole)
            .map(([role, title]) => ({
                role: role as UserRole,
                title: title
            })
        )
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, }}>
            <Box sx={{ width: '100%', maxWidth: 600 }}>
                <Typography variant='h4' component='p' sx={{ fontWeight: 'bold', mt: 8, textAlign: 'center' }}>新規登録({roleTitleMap[userRole]})</Typography>
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
                            <Typography>氏名</Typography>
                            <TextField fullWidth variant='outlined' {...register('user.name')} />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography>氏名カナ</Typography>
                            <TextField fullWidth variant='outlined' {...register('user.name_kana')} />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography>メールアドレス</Typography>
                            <TextField fullWidth variant='outlined' {...register('user.email', {
                                required: 'メールアドレスを入力してください',
                                pattern: {
                                    value: /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/,
                                    message: 'メールアドレスの形式が正しくありません',
                                }
                            })}
                            error={!!errors.user?.email}
                            helperText={errors.user?.email?.message}
                            />
                        </Box>
                        {
                            (userRole === 'student' || userRole === 'teacher') && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography>在籍高校</Typography>
                                    <TextField fullWidth variant='outlined' {...register('user.school_name')} />
                                </Box>
                            )
                        }
                        <Box sx={{ mb: 2 }}>
                            <Typography>パスワード</Typography>
                            <TextField type={showPassword ? 'text' : 'password'} fullWidth variant='outlined'
                                {...register('user.password', {
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
                            error={!!errors.user?.password}
                            helperText={errors.user?.password?.message}
                            />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography>パスワード(確認用)</Typography>
                            <TextField type={showConfirmationPassword ? 'text' : 'password'} fullWidth variant='outlined'
                                {...register('user.password_confirmation', {
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
                                            onClick={() => setShowConfirmationPassword(prev => !prev)}
                                            edge="end"
                                        >
                                            {showConfirmationPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                            error={!!errors.user?.password_confirmation}
                            helperText={errors.user?.password_confirmation?.message}
                            />
                        </Box>
                        <Box sx={{ my: 4 }}>
                            <Button
                                type='submit'
                                sx={{
                                    width: '100%',
                                    backgroundColor: '#0068b7',
                                    color: '#ffffff',
                                    p: 2,
                                    fontSize: 'large',
                                }}>
                                    <Typography sx={{ fontSize: 'large', textAlign: 'center' }}>登録</Typography>
                                </Button>
                        </Box>
                        {
                            renderTabs(userRole).map(({ role, title }) => (
                                <Box key={role} sx={{ width: '100%', textAlign: 'center', mb: 4 }}>
                                    <Link href={role === 'student' ? '/signup' : `/${role}/signup`}>{title}の方はこちら</Link>
                                </Box>
                            ))
                        }
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
