import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types/auth';
import { sessionStore } from '../services/sessionStore';

interface AuthCtx {
    user: User | null;
    isRestoring: boolean;
    signIn(u: User): Promise<void>;
    signOut(): Promise<void>;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export const useAuth = () => useContext(Ctx);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isRestoring, setIsRestoring] = useState(true);

    useEffect(() => {
        sessionStore.restore()
            .then(setUser)
            .finally(() => setIsRestoring(false));
    }, []);

    const signIn = useCallback(async (u: User) => {
        await sessionStore.set(u);
        setUser(u);
    }, []);

    const signOut = useCallback(async () => {
        await sessionStore.clear();
        setUser(null);
    }, []);

    return <Ctx.Provider value={{ user, isRestoring, signIn, signOut }}>{children}</Ctx.Provider>;
};