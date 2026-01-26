'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from './firebase';
import apiClient from './axios';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithGithub: () => Promise<void>;
    signOut: () => Promise<void>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    signInWithGithub: async () => { },
    signOut: async () => { },
    isAdmin: false,
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// ==========================================
// HELPER: Call auth webhook after authentication
// ==========================================

async function notifyAuthWebhook(user: User, provider: string) {
    try {
        const idToken = await user.getIdToken();

        const response = await apiClient.post('/webhook', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            provider,
            idToken,
        });

        console.log('Auth webhook success:', response.data);
    } catch (error) {
        console.error('Failed to notify auth webhook:', error);
        // Don't throw - we don't want to break the auth flow
    }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (user) {
            user.getIdToken(true).then(() => {
                return user.getIdTokenResult();
            }).then((idTokenResult) => {
                setIsAdmin(idTokenResult.claims.role === "admin");

            })
        }
    }, [user]);

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            // Notify webhook about the authentication
            await notifyAuthWebhook(result.user, 'google.com');
        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    const signInWithGithub = async () => {
        try {
            const provider = new GithubAuthProvider();
            const result = await signInWithPopup(auth, provider);

            // Notify webhook about the authentication
            await notifyAuthWebhook(result.user, 'github.com');
        } catch (error) {
            console.error('Error signing in with Github:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        signInWithGoogle,
        signInWithGithub,
        signOut,
        isAdmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
