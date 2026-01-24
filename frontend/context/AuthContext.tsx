'use client';

import { loginAuth, signUpAuth } from '@/libs/services/auth';
import {
  getCurrentUser,
} from '@/libs/services/user';
import { User } from '@/types/login/user';
import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';

type AuthState = {
    user: User | null;
    loading: boolean;
    hydrated: boolean;
};

type AuthActions = {
    login: (p: { email: string, password: string }) => Promise<void>;
    signUp: (p: { user: { email: string, name: string, name_kana: string, password: string, password_confirmation: string, user_role_name: string, school_name: string}}) => Promise<void>;
};

const AuthStateContext = createContext<AuthState| undefined>(undefined);
const AuthActionsContext = createContext<AuthActions | undefined>(undefined);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [hydrated, setHydrated] = useState<boolean>(false);

    useEffect(() => {
        const boot = async () => {
            try {
                const token = localStorage.getItem(TOKEN_KEY);
                const cachedUser = localStorage.getItem(USER_KEY);

                if (cachedUser) {
                    setUser(JSON.parse(cachedUser));
                }

                if (token && !cachedUser) {
                    const fresh = await getCurrentUser();
                    setUser(fresh);
                    localStorage.setItem(USER_KEY, JSON.stringify(fresh));
                }
            } catch (error) {
                console.error('auth boot failed', error);
                setUser(null);
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            } finally {
                setLoading(false);
                setHydrated(true);
            }
        };

        boot();
    }, []);

    const login: AuthActions['login'] = async({email, password}) => {
        setLoading(true);
        try {
            const { token, user } = await loginAuth({ email, password });

            if (token) {
                localStorage.setItem(TOKEN_KEY, token);
            }
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            setUser(user);
        } finally {
            setLoading(false);
        }
    };

    const signUp: AuthActions['signUp'] = async ({user: { email, name, name_kana, password, password_confirmation, user_role_name, school_name }}) => {
        setLoading(true);
        try {
            await signUpAuth({ user: { email, name, name_kana, password, password_confirmation, user_role_name, school_name } });
        } finally {
            setLoading(false);
        }
    };

    const stateValue = useMemo<AuthState>(
        () => ({ user, loading, hydrated }),
        [user, loading, hydrated]
    );

    const actionsValue: AuthActions = {
        login,
        signUp
    };

    return (
        <AuthActionsContext.Provider value={actionsValue}>
            <AuthStateContext.Provider value={stateValue}>
                {children}
            </AuthStateContext.Provider>
        </AuthActionsContext.Provider>
    );
};

export const useAuthState = (): AuthState => {
    const context = useContext(AuthStateContext);
    if (!context) throw new Error('useAuthState must be used within an AuthProvider');
    return context;
};

export const useAuthActions = (): AuthActions => {
    const context = useContext(AuthActionsContext);
    if (!context) throw new Error('useAuthActions must be used within an AuthProvider');
    return context;
};
