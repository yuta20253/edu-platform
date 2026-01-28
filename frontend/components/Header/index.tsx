'use client';

import { AppBar } from "@mui/material";
import { Box, Button } from '@mui/material';
import ToolBar from '@mui/material/Toolbar';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Link from 'next/link';
import { JSX } from 'react';
import { useAuthState } from "@/context/AuthContext";

export const Header = (): JSX.Element => {
    const { user } = useAuthState();
    return (
        <>
            <AppBar position="fixed">
                <ToolBar>
                    <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
                        <Link href="/" aria-label="ホームヘ" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                            <span
                                style={{
                                fontSize: '0.8rem',
                                letterSpacing: '0.25em',
                                textShadow: '0 0 6px rgba(0, 0, 0, 0.25)',
                                }}
                            >
                                学習App(仮)
                            </span>
                        </Link>
                    </Box>
                    {
                        user ? (
                            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#fff' }}>
                                <AccountCircleIcon />
                                {user.name}
                            </Link>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button LinkComponent={Link} color="inherit" variant="outlined" href="/login">ログイン</Button>
                                <Button LinkComponent={Link} color="inherit" variant="outlined" href="/signup">新規作成</Button>
                            </Box>
                        )
                    }
                </ToolBar>
            </AppBar>
        </>
    );
};
