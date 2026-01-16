
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasPin, setHasPin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Init check
        const storedAuth = localStorage.getItem('auth_session');
        const storedPin = localStorage.getItem('security_pin');
        
        if (storedAuth === 'active') {
            setIsAuthenticated(true);
        }
        
        if (storedPin) {
            setHasPin(true);
        }
        
        setLoading(false);
    }, []);

    const login = (username, password) => {
        if (username === 'Euge' && password === '2222') {
            localStorage.setItem('auth_session', 'active');
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem('auth_session');
        setIsAuthenticated(false);
    };

    const setSecurityPin = (pin) => {
        localStorage.setItem('security_pin', pin);
        setHasPin(true);
    };

    const verifyPin = (pin) => {
        const stored = localStorage.getItem('security_pin');
        return stored === pin;
    };

    const resetPin = () => {
         // In a real app, we'd require old pin first, but prompt implies a reset option
         localStorage.removeItem('security_pin');
         setHasPin(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, hasPin, login, logout, setSecurityPin, verifyPin, resetPin, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
