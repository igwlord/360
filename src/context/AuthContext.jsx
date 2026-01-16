
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    // Initialize state directly to avoid effect update warning
    const [hasPin, setHasPin] = useState(() => !!localStorage.getItem('security_pin'));

    useEffect(() => {
        // 1. Check active session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                setIsAuthenticated(true);
            }
            setLoading(false);
        };

        getSession();

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setUser(null);
    };

    // PIN Logic (Kept Local for UI preference/protection of sensitive actions)
    const setSecurityPin = (pin) => {
        localStorage.setItem('security_pin', pin);
        setHasPin(true);
    };

    const verifyPin = (pin) => {
        const stored = localStorage.getItem('security_pin');
        return stored === pin;
    };

    const resetPin = () => {
         localStorage.removeItem('security_pin');
         setHasPin(false);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            isAuthenticated, 
            loading, 
            login, 
            logout, 
            hasPin, 
            setSecurityPin, 
            verifyPin, 
            resetPin 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
