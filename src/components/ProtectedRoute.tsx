import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
        // Petit écran de chargement pendant qu'on vérifie la session
        return (
            <div className="h-screen w-screen bg-[#1f2326] flex items-center justify-center text-white">
                Chargement...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};